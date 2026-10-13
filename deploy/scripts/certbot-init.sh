#!/usr/bin/env bash
# Issues the first certificate. Run once per site, on the machine, after DNS points here.
#
#   deploy/scripts/certbot-init.sh vitalpair.example.com you@example.com
#   deploy/scripts/certbot-init.sh vitalpair.example.com you@example.com www.vitalpair.example.com
#
# The first name is the canonical one and has to be the site's SERVER_NAME: it is passed as
# --cert-name, which is what names the directory nginx reads the files from, and it is the
# name in the certificate's subject. Any name after the e-mail is an alias, covered by the
# same certificate, which is what lets the alias server redirect over https. Every name
# listed has to resolve to this machine before this runs.
#
# Renewal afterwards is automatic: the certbot container in compose.edge.yaml checks twice
# a day and nginx re-reads the files daily. Adding an alias later means running this again
# with every name: --cert-name plus --expand grow the existing certificate instead of
# creating a second one beside it, which nginx would never read.
set -euo pipefail

DOMAIN="${1:?usage: certbot-init.sh <domain> <email> [alias...]}"
EMAIL="${2:?usage: certbot-init.sh <domain> <email> [alias...]}"
shift 2
ALIASES=("$@")
STAGING="${STAGING:-1}"

cd "$(dirname "$0")/.."

# Let's Encrypt allows five failed attempts per domain per hour, and a mistake here is
# usually a DNS record that has not propagated. STAGING=1 uses their test service, which
# issues an untrusted certificate but has no meaningful limit: get it working there first,
# then run again with STAGING=0 for the real one.
if [ "${STAGING}" = "1" ]; then
  echo "Using the Let's Encrypt STAGING service: the certificate will not be trusted by browsers."
  echo "Once this succeeds, run again with STAGING=0 for a real certificate."
  staging_flag="--staging"
else
  echo "Requesting a REAL certificate. Five failures an hour for this domain and you are locked out."
  staging_flag=""
fi

# nginx must be answering on port 80 before this runs: the challenge is a file it serves.
# Every name goes through this, aliases included. Let's Encrypt validates each -d separately,
# so one name that does not resolve here fails the whole request and spends an attempt.
#
# The two curls are not redundant. The first asks for the challenge path, which answers 404
# on a working edge, and -sf turns that into failure; the second only needs something to
# answer at all. Together they mean "nginx is up", not "the file is there".
for name in "${DOMAIN}" ${ALIASES[@]+"${ALIASES[@]}"}; do
  if ! curl -sf -o /dev/null --max-time 10 "http://${name}/.well-known/acme-challenge/probe" \
    && ! curl -s -o /dev/null --max-time 10 "http://${name}/"; then
    echo "Nothing answers on http://${name}. Start the edge first:" >&2
    echo "  docker compose -f deploy/compose.edge.yaml --env-file deploy/env/edge.env up -d" >&2
    echo "If the edge is already up, ${name} does not point at this machine yet." >&2
    exit 1
  fi
done

# A placeholder may be in the way. nginx refuses to start without a certificate file, so a
# new machine boots the edge with the self-signed one from selfsigned.sh and replaces it
# here; certbot will not write into a live/ directory it did not create, so the placeholder
# goes first. A certificate certbot issued has a renewal file and is left alone, except when
# it came from the staging service and a real one is being asked for now: certbot would
# keep the untrusted one as "not yet due", so that lineage is deleted.
docker compose -f compose.edge.yaml run --rm --entrypoint sh certbot -c "
  renewal=/etc/letsencrypt/renewal/${DOMAIN}.conf
  if [ -f \"\$renewal\" ] && [ '${STAGING}' = '0' ] && grep -q acme-staging \"\$renewal\"; then
    certbot delete --cert-name '${DOMAIN}' --non-interactive
    echo 'removed the staging certificate for ${DOMAIN}'
  elif [ ! -f \"\$renewal\" ] && [ -d /etc/letsencrypt/live/${DOMAIN} ]; then
    rm -rf /etc/letsencrypt/live/${DOMAIN}
    echo 'removed the placeholder certificate for ${DOMAIN}'
  fi"

# One -d per name, canonical first. The order no longer decides anything, because
# --cert-name below pins the directory (certbot's _choose_lineagename prefers certname over
# the first -d), but the canonical name leading still matches the order everything else
# documents, and it is the name in the certificate's subject.
domain_flags=(-d "${DOMAIN}")
for name in ${ALIASES[@]+"${ALIASES[@]}"}; do
  domain_flags+=(-d "${name}")
done

# --expand is what lets an alias be added to a certificate that already exists. Without it
# certbot asks whether to expand the lineage, and `certbot --help all` gives that question
# the default "Ask"; under --non-interactive there is nobody to answer and it fails. The
# first production certificate was issued for the bare domain alone, so adding www. goes
# through exactly this path.
docker compose -f compose.edge.yaml run --rm --entrypoint certbot certbot \
  certonly --webroot -w /var/www/certbot \
  ${staging_flag} \
  "${domain_flags[@]}" \
  --cert-name "${DOMAIN}" \
  --expand \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  --non-interactive

echo "certificate issued; reloading nginx so it is used"
docker compose -f compose.edge.yaml exec nginx nginx -s reload

echo
echo "Verify it:"
echo "  curl -vI https://${DOMAIN}/ 2>&1 | grep -iE 'subject|issuer|HTTP/'"
for name in ${ALIASES[@]+"${ALIASES[@]}"}; do
  # The alias has to answer and then send the browser to the canonical name: expect a 301
  # with location: https://${DOMAIN}/. A 200 here means the alias is serving the site
  # itself, which splits the site over two addresses.
  echo "  curl -sI https://${name}/ | grep -iE 'HTTP/|location'"
done
