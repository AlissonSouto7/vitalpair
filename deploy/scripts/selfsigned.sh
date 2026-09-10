#!/usr/bin/env bash
# Puts a self-signed certificate where the edge expects the real one, for rehearsing the
# whole stack on a machine that has no domain.
#
#   deploy/scripts/selfsigned.sh localhost
#
# Browsers and curl will not trust it (curl needs -k, which smoke.sh already passes). That
# is fine: the redirect, HSTS, the routing, the rate limit and the basic auth are exercised
# exactly as on the server, and the one thing a rehearsal cannot verify is the issuance,
# which is certbot-init.sh's job there.
#
# Never run this on the real machine: it overwrites the certificate certbot issued.
set -euo pipefail

DOMAIN="${1:?usage: selfsigned.sh <domain>}"
# The volume compose.edge.yaml declares, named after its project.
VOLUME="${CERTS_VOLUME:-vitalpair-edge_certs}"

docker volume create "${VOLUME}" > /dev/null

docker run --rm -v "${VOLUME}:/etc/letsencrypt" --entrypoint sh alpine/openssl:3.5.8 -c "
  set -e
  mkdir -p /etc/letsencrypt/live/${DOMAIN}
  openssl req -x509 -nodes -newkey rsa:2048 -days 30 \
    -subj '/CN=${DOMAIN}' -addext 'subjectAltName=DNS:${DOMAIN}' \
    -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
    -out /etc/letsencrypt/live/${DOMAIN}/fullchain.pem 2> /dev/null
  chmod 644 /etc/letsencrypt/live/${DOMAIN}/*.pem
"

echo "self-signed certificate for ${DOMAIN} written to volume ${VOLUME}; valid 30 days, trusted by nobody"
