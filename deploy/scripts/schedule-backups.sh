#!/usr/bin/env bash
# Installs the nightly backup as a systemd timer.
#
#   deploy/scripts/schedule-backups.sh staging
#   deploy/scripts/schedule-backups.sh production
#
# backup.sh was written to run "before every deploy and from cron", and the deploy half was
# true from the start. The cron half was not: on the real server there was no schedule at
# all, so the only dumps that existed were the ones a deploy happened to take. An
# environment nobody had deployed to for a week had a week-old backup and nothing said so.
#
# A systemd timer rather than cron: the Ubuntu image this runs on has no cron package
# installed, systemd is already running the machine, and a timer gives `systemctl status`,
# journald logs and a Persistent= catch-up after a reboot without writing any of it.
#
# Idempotent: run it again and the unit is rewritten, so changing the hour is one more run.
set -euo pipefail

ENVIRONMENT="${1:?usage: schedule-backups.sh <staging|production>}"
# 03:12 rather than 03:00, with a randomised delay: everything on every machine runs at the
# top of the hour, and a dump competing with log rotation is a slower dump.
WHEN="${BACKUP_AT:-03:12}"

case "${ENVIRONMENT}" in
staging | production) ;;
*)
    echo "environment must be staging or production, not '${ENVIRONMENT}'" >&2
    exit 1
    ;;
esac

repo="$(cd "$(dirname "$0")/../.." && pwd)"
[ -x "${repo}/deploy/scripts/backup.sh" ] || {
    echo "missing or not executable: ${repo}/deploy/scripts/backup.sh" >&2
    exit 1
}

unit="vitalpair-backup-${ENVIRONMENT}"
user="$(id -un)"

sudo tee "/etc/systemd/system/${unit}.service" > /dev/null << UNIT
[Unit]
Description=VitalPair ${ENVIRONMENT} database backup
# A dump of a database that is not running would be an empty file with a fresh timestamp,
# which is worse than no file: it looks like a backup.
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
User=${user}
WorkingDirectory=${repo}/deploy
ExecStart=${repo}/deploy/scripts/backup.sh ${ENVIRONMENT}
UNIT

sudo tee "/etc/systemd/system/${unit}.timer" > /dev/null << UNIT
[Unit]
Description=Nightly VitalPair ${ENVIRONMENT} database backup

[Timer]
OnCalendar=*-*-* ${WHEN}:00
# Catches up after a reboot or a machine that was off at 03:12, instead of silently
# skipping a night.
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now "${unit}.timer"

echo "scheduled: ${unit}.timer at ${WHEN} daily"
echo
echo "Verify it is really armed, and that a dump lands:"
echo "  systemctl list-timers ${unit}.timer"
echo "  sudo systemctl start ${unit}.service && journalctl -u ${unit} -n 20 --no-pager"
echo "  ls -lt /var/backups/vitalpair/${ENVIRONMENT} | head"
