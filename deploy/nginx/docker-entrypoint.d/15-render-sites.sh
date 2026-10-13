#!/bin/sh
# Renders one site per environment this machine serves.
#
# The nginx image's own step renders everything in templates/ once, with one set of
# variables, which cannot produce two sites with different names. This runs first, from
# the same entrypoint, and writes conf.d/site-<environment>.conf for each of
# STAGING_SERVER_NAME and PRODUCTION_SERVER_NAME that is set. Leave one empty and that
# environment does not exist on this machine: no server block, no certificate needed.
#
# Each site may also declare aliases, space separated, in <ENVIRONMENT>_SERVER_ALIASES: other
# names that answer and redirect to the canonical one. Production is the bare domain, and
# somebody typing www. in front of it has to arrive. Without aliases the alias block is cut
# out entirely rather than rendered empty: `server_name` with no value is not valid, and
# nginx refuses the whole configuration and does not start.
set -eu

template=/etc/nginx/site.conf.template

# The image ships a "Welcome to nginx" site on port 80. It must go, or it answers for any
# name the sites below do not claim.
rm -f /etc/nginx/conf.d/default.conf

rendered=0
render() {
  out="/etc/nginx/conf.d/site-$1.conf"
  # The single quotes are deliberate: envsubst's argument is the LIST of names it is allowed
  # to replace, written as text, so the shell must not expand it. It is the list that keeps
  # nginx's own $host and $request_uri intact.
  # shellcheck disable=SC2016
  ENVIRONMENT="$1" SERVER_NAME="$2" SERVER_ALIASES="${3:-}" \
    envsubst '${ENVIRONMENT} ${SERVER_NAME} ${SERVER_ALIASES}' < "${template}" > "${out}"

  if [ -z "${3:-}" ]; then
    # Drops the alias server entirely: from its comment down to the brace that closes it.
    # Measured: left in with no names, nginx fails with `invalid number of arguments in
    # "server_name"` and the container does not start, taking the site down with it.
    sed -i '/^# The aliases, over both protocols/,/^}$/d' "${out}"
    echo "edge: serving $1 as $2"
  else
    echo "edge: serving $1 as $2 (also answering for: $3)"
  fi
  rendered=$((rendered + 1))
}

if [ -n "${STAGING_SERVER_NAME:-}" ]; then
  render staging "${STAGING_SERVER_NAME}" "${STAGING_SERVER_ALIASES:-}"
fi
if [ -n "${PRODUCTION_SERVER_NAME:-}" ]; then
  render production "${PRODUCTION_SERVER_NAME}" "${PRODUCTION_SERVER_ALIASES:-}"
fi

if [ "${rendered}" -eq 0 ]; then
  echo "edge: set STAGING_SERVER_NAME and/or PRODUCTION_SERVER_NAME, or nothing is served" >&2
  exit 1
fi
