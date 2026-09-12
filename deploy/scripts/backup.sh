#!/usr/bin/env bash
# Takes a compressed dump of the database.
#
# Run before every deploy and from cron. A migration is forward-only: rolling the
# application back to yesterday's image does not undo a column it dropped, so the dump is
# the only way back from a migration that turns out to be wrong.
#
#   deploy/scripts/backup.sh staging
#
# The custom format (-Fc) rather than plain SQL: it is compressed, and pg_restore can pull
# a single table out of it without replaying the whole file.
set -euo pipefail
umask 077

ENVIRONMENT="${1:?usage: backup.sh <staging|production>}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/vitalpair/${ENVIRONMENT}}"
KEEP="${BACKUP_KEEP:-7}"
STACK="vitalpair-${ENVIRONMENT}"

container="$(docker compose -p "${STACK}" ps -q postgres)"
if [ -z "${container}" ]; then
  echo "no postgres container in stack ${STACK}; is it running?" >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="${BACKUP_DIR}/vitalpair-${stamp}.dump"

echo "dumping ${STACK} to ${target}"
# The password comes from the container's own environment, so it is never written into a
# command line where `ps` would show it.
docker exec "${container}" sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "${target}"

# A dump that is written but unreadable is worse than none, because it is trusted. This
# reads the archive's table of contents, which fails on a truncated or corrupt file.
if ! docker run --rm -i postgres:16-alpine pg_restore --list < "${target}" > /dev/null; then
  echo "the dump is not readable; removing it rather than keeping a false safety net" >&2
  rm -f "${target}"
  exit 1
fi

size="$(du -h "${target}" | cut -f1)"
echo "wrote ${target} (${size}), verified readable"

# Keep the most recent few. Without this the disk fills and the machine stops, which is a
# worse outage than the one the backups exist to survive.
ls -1t "${BACKUP_DIR}"/vitalpair-*.dump 2>/dev/null | tail -n "+$((KEEP + 1))" | while read -r old; do
  echo "removing old backup ${old}"
  rm -f "${old}"
done
