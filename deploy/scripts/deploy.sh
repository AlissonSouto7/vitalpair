#!/usr/bin/env bash
# Deploys one environment and rolls back if the result does not work.
#
#   deploy/scripts/deploy.sh staging ghcr.io/alissonsouto7/vitalpair-backend:abc1234 \
#                                    ghcr.io/alissonsouto7/vitalpair-frontend:abc1234
#
# The order matters: back up first, because a migration cannot be undone by changing the
# image back; then start; then prove it works; and only then record the version as good.
set -euo pipefail

ENVIRONMENT="${1:?usage: deploy.sh <staging|production> <backend image> <frontend image>}"
BACKEND_IMAGE="${2:?backend image required}"
FRONTEND_IMAGE="${3:?frontend image required}"

cd "$(dirname "$0")/.."
ENV_FILE="env/${ENVIRONMENT}.env"
[ -f "${ENV_FILE}" ] || { echo "missing ${ENV_FILE}" >&2; exit 1; }

STATE_FILE="env/.deployed-${ENVIRONMENT}"
# The version the last good deploy replaced, kept so rollback.sh has somewhere to go back to
# when a deploy passes the smoke test and turns out wrong anyway.
PREVIOUS_FILE="env/.previous-${ENVIRONMENT}"
compose() { docker compose -f compose.app.yaml --env-file "${ENV_FILE}" "$@"; }

# shellcheck disable=SC1090
PUBLIC_URL="$(grep -E '^PUBLIC_URL=' "${ENV_FILE}" | cut -d= -f2-)"
[ -n "${PUBLIC_URL}" ] || { echo "PUBLIC_URL is not set in ${ENV_FILE}" >&2; exit 1; }

previous_backend=""
previous_frontend=""
if [ -f "${STATE_FILE}" ]; then
  previous_backend="$(grep -E '^BACKEND_IMAGE=' "${STATE_FILE}" | cut -d= -f2- || true)"
  previous_frontend="$(grep -E '^FRONTEND_IMAGE=' "${STATE_FILE}" | cut -d= -f2- || true)"
fi

echo "==> backing up ${ENVIRONMENT} before touching anything"
if compose ps -q postgres | grep -q .; then
  ./scripts/backup.sh "${ENVIRONMENT}"
else
  echo "    (nothing running yet; first deploy)"
fi

echo "==> pulling images"
# A pull failure is not fatal on its own: an image built on this machine has no registry
# to pull from, which is the normal case for a rehearsal. What is fatal is the image not
# existing at all afterwards. Without this check compose would build one from whatever
# source is on the machine, because the service declares how to, and a mistyped tag would
# "deploy" successfully with code nobody chose. Found exactly that way, in a rehearsal.
BACKEND_IMAGE="${BACKEND_IMAGE}" FRONTEND_IMAGE="${FRONTEND_IMAGE}" compose pull backend frontend \
  || echo "    (could not pull; using the local images if they exist)"
for image in "${BACKEND_IMAGE}" "${FRONTEND_IMAGE}"; do
  docker image inspect "${image}" > /dev/null 2>&1 \
    || { echo "image ${image} does not exist here or in the registry; refusing to build on a server" >&2; exit 1; }
done

echo "==> starting"
BACKEND_IMAGE="${BACKEND_IMAGE}" FRONTEND_IMAGE="${FRONTEND_IMAGE}" compose up -d --no-build --wait --wait-timeout 180

echo "==> smoke test"
if ./scripts/smoke.sh "${PUBLIC_URL}"; then
  [ -f "${STATE_FILE}" ] && cp "${STATE_FILE}" "${PREVIOUS_FILE}"
  printf 'BACKEND_IMAGE=%s\nFRONTEND_IMAGE=%s\n' "${BACKEND_IMAGE}" "${FRONTEND_IMAGE}" > "${STATE_FILE}"
  echo "==> deployed ${ENVIRONMENT}"
  exit 0
fi

echo "==> smoke test failed" >&2
if [ -z "${previous_backend}" ]; then
  # Nothing to go back to. Leaving it running is right: a first deploy that fails is easier
  # to diagnose while it is up, and there are no users to protect from it yet.
  echo "no previous version recorded, so there is nothing to roll back to." >&2
  echo "the failing version is still running; look at the logs:" >&2
  echo "  docker compose -f deploy/compose.app.yaml --env-file ${ENV_FILE} logs --tail=100 backend" >&2
  exit 1
fi

echo "==> rolling back to ${previous_backend}" >&2
BACKEND_IMAGE="${previous_backend}" FRONTEND_IMAGE="${previous_frontend}" \
  compose up -d --no-build --wait --wait-timeout 180

if ./scripts/smoke.sh "${PUBLIC_URL}"; then
  echo "==> rolled back; ${ENVIRONMENT} is serving the previous version" >&2
else
  # The database may have moved forward under a migration the old image does not know
  # about, which is exactly the case the backup exists for.
  echo "==> the rollback did not pass the smoke test either." >&2
  echo "    A migration may have changed the schema. Restore the backup taken above:" >&2
  echo "    deploy/scripts/restore.sh ${ENVIRONMENT} <the dump from this run>" >&2
fi
exit 1
