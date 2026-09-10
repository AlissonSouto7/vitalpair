#!/usr/bin/env bash
# Puts an environment back on the version that was running before the last deploy.
#
#   deploy/scripts/rollback.sh staging
#
# deploy.sh already rolls back on its own when the smoke test fails. This is for the other
# case: a deploy that passed the smoke test and turned out wrong anyway, noticed by a person
# an hour later. It goes to the version deploy.sh recorded as the previous good one.
#
# It does not touch the database. If the deploy being undone ran a migration, the old image
# may not understand the schema any more; the backup deploy.sh took before starting is the
# way out of that, with restore.sh.
set -euo pipefail

ENVIRONMENT="${1:?usage: rollback.sh <staging|production>}"

cd "$(dirname "$0")/.."
ENV_FILE="env/${ENVIRONMENT}.env"
STATE_FILE="env/.deployed-${ENVIRONMENT}"
PREVIOUS_FILE="env/.previous-${ENVIRONMENT}"
[ -f "${ENV_FILE}" ] || { echo "missing ${ENV_FILE}" >&2; exit 1; }
[ -f "${PREVIOUS_FILE}" ] || {
  echo "no previous version recorded for ${ENVIRONMENT}; nothing to roll back to." >&2
  echo "deploy.sh writes ${PREVIOUS_FILE} from the second successful deploy on." >&2
  exit 1
}

compose() { docker compose -f compose.app.yaml --env-file "${ENV_FILE}" "$@"; }
image_in() { grep -E "^$2=" "$1" | cut -d= -f2-; }

PUBLIC_URL="$(grep -E '^PUBLIC_URL=' "${ENV_FILE}" | cut -d= -f2-)"
[ -n "${PUBLIC_URL}" ] || { echo "PUBLIC_URL is not set in ${ENV_FILE}" >&2; exit 1; }

backend="$(image_in "${PREVIOUS_FILE}" BACKEND_IMAGE)"
frontend="$(image_in "${PREVIOUS_FILE}" FRONTEND_IMAGE)"
[ -n "${backend}" ] && [ -n "${frontend}" ] || { echo "${PREVIOUS_FILE} is incomplete" >&2; exit 1; }

for image in "${backend}" "${frontend}"; do
  docker image inspect "${image}" > /dev/null 2>&1 \
    || { echo "image ${image} is no longer on this machine; pull it first" >&2; exit 1; }
done

echo "==> rolling ${ENVIRONMENT} back to ${backend}"
# --no-build for the same reason as in deploy.sh: a rollback must never build.
BACKEND_IMAGE="${backend}" FRONTEND_IMAGE="${frontend}" compose up -d --no-build --wait --wait-timeout 180

echo "==> smoke test"
if ! ./scripts/smoke.sh "${PUBLIC_URL}"; then
  echo "==> the previous version does not pass the smoke test either." >&2
  echo "    A migration may have changed the schema. Restore the backup deploy.sh took:" >&2
  echo "    deploy/scripts/restore.sh ${ENVIRONMENT} <the dump from that deploy>" >&2
  exit 1
fi

# The two records swap, so a rollback can itself be undone by running this again.
undone="$(mktemp)"
cp "${STATE_FILE}" "${undone}"
printf 'BACKEND_IMAGE=%s\nFRONTEND_IMAGE=%s\n' "${backend}" "${frontend}" > "${STATE_FILE}"
mv "${undone}" "${PREVIOUS_FILE}"

echo "==> ${ENVIRONMENT} is serving ${backend}"
