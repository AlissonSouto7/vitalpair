#!/usr/bin/env bash
# Creates or replaces a user in the file the edge uses for basic auth on staging.
#
#   deploy/scripts/htpasswd.sh <user>
#   PASSWORD=... deploy/scripts/htpasswd.sh ci        # non-interactive
#
# The file is env/htpasswd: mounted read-only into the proxy, read on every request rather
# than at startup, and never committed. apr1 is the hash every nginx build understands;
# bcrypt is stronger but needs nginx compiled with it, which the stock image is not.
set -euo pipefail
umask 077

USER_NAME="${1:?usage: htpasswd.sh <user>}"

cd "$(dirname "$0")/.."
FILE="env/htpasswd"

if [ -n "${PASSWORD:-}" ]; then
  pass="${PASSWORD}"
else
  read -r -s -p "Password for ${USER_NAME}: " pass
  echo
fi
[ "${#pass}" -ge 12 ] || { echo "use at least 12 characters" >&2; exit 1; }

# Through stdin, so the password never appears on a command line where ps would show it.
hash="$(printf '%s' "${pass}" | openssl passwd -apr1 -stdin)"

touch "${FILE}"
chmod 600 "${FILE}"
# One line per user: an existing entry for the same name is replaced, not duplicated.
{ grep -v "^${USER_NAME}:" "${FILE}" || true; printf '%s:%s\n' "${USER_NAME}" "${hash}"; } > "${FILE}.tmp"
mv "${FILE}.tmp" "${FILE}"

echo "wrote ${USER_NAME} to ${FILE}; nginx reads it per request, nothing to restart"
