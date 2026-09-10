#!/usr/bin/env bash
# Puts a self-signed certificate where the edge expects the real one.
#
#   deploy/scripts/selfsigned.sh localhost
#
# Two uses. On a developer machine it is the certificate for the whole rehearsal: browsers
# and curl will not trust it (curl needs -k, which smoke.sh already passes), and everything
# else, the redirect, HSTS, the routing, the rate limit and the basic auth, is exercised
# exactly as on a server. On a new server it is the placeholder that lets the edge start at
# all: nginx refuses to run without a certificate file, and certbot needs nginx running to
# answer the challenge. certbot-init.sh replaces the placeholder with the real one.
#
# It refuses to touch a certificate certbot issued, which is the one thing it must never do.
set -euo pipefail

DOMAIN="${1:?usage: selfsigned.sh <domain>}"
# The volume compose.edge.yaml declares, named after its project.
VOLUME="${CERTS_VOLUME:-vitalpair-edge_certs}"

docker volume create "${VOLUME}" > /dev/null

docker run --rm -v "${VOLUME}:/etc/letsencrypt" --entrypoint sh alpine/openssl:3.5.8 -c "
  set -e
  if [ -f /etc/letsencrypt/renewal/${DOMAIN}.conf ]; then
    echo 'a certificate certbot issued exists for ${DOMAIN}; refusing to overwrite it' >&2
    exit 1
  fi
  mkdir -p /etc/letsencrypt/live/${DOMAIN}
  openssl req -x509 -nodes -newkey rsa:2048 -days 30 \
    -subj '/CN=${DOMAIN}' -addext 'subjectAltName=DNS:${DOMAIN}' \
    -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
    -out /etc/letsencrypt/live/${DOMAIN}/fullchain.pem 2> /dev/null
  chmod 644 /etc/letsencrypt/live/${DOMAIN}/*.pem
"

echo "self-signed certificate for ${DOMAIN} written to volume ${VOLUME}; valid 30 days, trusted by nobody"
