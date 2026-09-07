#!/usr/bin/env bash
# Restores a dump over an environment's database.
#
#   deploy/scripts/restore.sh staging /var/backups/vitalpair/staging/vitalpair-20260906T120000Z.dump
#
# This destroys the current data. It asks before doing so, unless FORCE=1, because the one
# time this script is run is a bad day and a mistyped environment makes it worse.
set -euo pipefail

ENVIRONMENT="${1:?usage: restore.sh <staging|production> <dump file>}"
DUMP="${2:?usage: restore.sh <staging|production> <dump file>}"
STACK="vitalpair-${ENVIRONMENT}"

[ -f "${DUMP}" ] || { echo "no such dump: ${DUMP}" >&2; exit 1; }

container="$(docker compose -p "${STACK}" ps -q postgres)"
if [ -z "${container}" ]; then
  echo "no postgres container in stack ${STACK}" >&2
  exit 1
fi

if [ "${FORCE:-0}" != "1" ]; then
  echo "About to REPLACE the ${ENVIRONMENT} database with ${DUMP}."
  echo "Everything currently in it will be lost."
  printf 'Type the environment name to confirm: '
  read -r answer
  [ "${answer}" = "${ENVIRONMENT}" ] || { echo "aborted"; exit 1; }
fi

# The application is stopped first: restoring under a running application leaves it holding
# connections to tables that are being dropped, and it will write into the half-restored
# database as it retries.
echo "stopping the application"
docker compose -p "${STACK}" stop backend

echo "restoring"
# --clean --if-exists drops what it is about to recreate, so the result is the dump exactly
# rather than the dump merged into whatever was there.
docker exec -i "${container}" sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' \
  < "${DUMP}"

echo "starting the application"
docker compose -p "${STACK}" start backend

echo "restored ${DUMP} into ${ENVIRONMENT}"
echo "Check the row counts before trusting it:"
echo "  docker exec ${container} psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c 'select count(*) from users'"
