#!/bin/sh
# Renders one site per environment this machine serves.
#
# The nginx image's own step renders everything in templates/ once, with one set of
# variables, which cannot produce two sites with different names. This runs first, from
# the same entrypoint, and writes conf.d/site-<environment>.conf for each of
# STAGING_SERVER_NAME and PRODUCTION_SERVER_NAME that is set. Leave one empty and that
# environment does not exist on this machine: no server block, no certificate needed.
set -eu

template=/etc/nginx/site.conf.template

# The image ships a "Welcome to nginx" site on port 80. It must go, or it answers for any
# name the sites below do not claim.
rm -f /etc/nginx/conf.d/default.conf

rendered=0
render() {
  ENVIRONMENT="$1" SERVER_NAME="$2" envsubst '${ENVIRONMENT} ${SERVER_NAME}' \
    < "${template}" > "/etc/nginx/conf.d/site-$1.conf"
  echo "edge: serving $1 as $2"
  rendered=$((rendered + 1))
}

if [ -n "${STAGING_SERVER_NAME:-}" ]; then
  render staging "${STAGING_SERVER_NAME}"
fi
if [ -n "${PRODUCTION_SERVER_NAME:-}" ]; then
  render production "${PRODUCTION_SERVER_NAME}"
fi

if [ "${rendered}" -eq 0 ]; then
  echo "edge: set STAGING_SERVER_NAME and/or PRODUCTION_SERVER_NAME, or nothing is served" >&2
  exit 1
fi
