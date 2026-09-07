#!/usr/bin/env bash
# Issues the first certificate. Run once per domain, on the machine, after DNS points here.
#
#   deploy/scripts/certbot-init.sh vitalpair.example.com you@example.com
#
# Renewal afterwards is automatic: the certbot container in compose.edge.yaml checks twice
# a day and nginx re-reads the files daily.
set -euo pipefail

DOMAIN="${1:?usage: certbot-init.sh <domain> <email>}"
EMAIL="${2:?usage: certbot-init.sh <domain> <email>}"
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
if ! curl -sf -o /dev/null --max-time 10 "http://${DOMAIN}/.well-known/acme-challenge/probe" \
  && ! curl -s -o /dev/null --max-time 10 "http://${DOMAIN}/"; then
  echo "Nothing answers on http://${DOMAIN}. Start the edge first:" >&2
  echo "  docker compose -f deploy/compose.edge.yaml --env-file deploy/env/edge.env up -d" >&2
  exit 1
fi

docker compose -f compose.edge.yaml run --rm --entrypoint certbot certbot \
  certonly --webroot -w /var/www/certbot \
  ${staging_flag} \
  -d "${DOMAIN}" \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  --non-interactive

echo "certificate issued; reloading nginx so it is used"
docker compose -f compose.edge.yaml exec nginx nginx -s reload

echo
echo "Verify it:"
echo "  curl -vI https://${DOMAIN}/ 2>&1 | grep -iE 'subject|issuer|HTTP/'"
