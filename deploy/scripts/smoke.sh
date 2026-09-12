#!/usr/bin/env bash
# Asks a running environment whether it actually works.
#
#   deploy/scripts/smoke.sh https://vitalpair.example.com
#
# Run after every deploy. Containers reporting healthy is not the same as the site working:
# a healthy backend behind a proxy that routes to the wrong place serves nothing, and a
# frontend whose assets failed to copy serves a blank page with a 200.
#
# Every check is read-only. Nothing here writes to the database, so it is safe against
# production.
set -euo pipefail

BASE="${1:?usage: smoke.sh <base url>}"
BASE="${BASE%/}"
failures=0

check() {
  local description="$1" expected="$2" actual="$3"
  if [ "${actual}" = "${expected}" ]; then
    printf '  ok    %-46s %s\n' "${description}" "${actual}"
  else
    printf '  FAIL  %-46s got %s, expected %s\n' "${description}" "${actual}" "${expected}"
    failures=$((failures + 1))
  fi
}

status() { curl -sk -o /dev/null -w '%{http_code}' --max-time 15 "$1"; }

echo "smoke test against ${BASE}"

# The interface itself.
check "the site answers" 200 "$(status "${BASE}/")"

# A client-side route must serve the application, not a 404 from the static server.
check "a deep link serves the app" 200 "$(status "${BASE}/dashboard")"

# The API is reachable through the proxy. An unauthenticated call to a protected route
# should be refused, which proves both that the route exists and that it is guarded.
check "the API refuses an anonymous call" 401 "$(status "${BASE}/api/v1/users/me")"

# Login exists and rejects nonsense without failing.
login_status="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 15 \
  -X POST "${BASE}/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke-test@invalid.local","password":"not-a-real-password"}')"
check "login rejects bad credentials" 401 "${login_status}"

# Metrics are kept off the public port on purpose. If this ever answers, the proxy is
# exposing a live readout of the system to the internet.
check "metrics are NOT public" 404 "$(status "${BASE}/actuator/prometheus")"
check "health is NOT public" 404 "$(status "${BASE}/actuator/health")"

# HTTP must not serve the site; it exists only to redirect and to answer the certificate
# challenge. On a server the plain address is the same name with the scheme swapped; a
# rehearsal on a developer machine answers on two odd ports and says so with SMOKE_HTTP_URL.
plain="${SMOKE_HTTP_URL:-${BASE/https:/http:}}"
check "plain HTTP redirects" 301 "$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "${plain}/")"

# The header that stops a browser from ever using plain HTTP for this domain again.
if curl -sk -I --max-time 15 "${BASE}/" | grep -qi '^strict-transport-security:'; then
  printf '  ok    %-46s present\n' "HSTS header"
else
  printf '  FAIL  %-46s missing\n' "HSTS header"
  failures=$((failures + 1))
fi

echo
if [ "${failures}" -eq 0 ]; then
  echo "all checks passed"
else
  echo "${failures} check(s) failed"
  exit 1
fi
