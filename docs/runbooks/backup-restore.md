# Runbook: backups and restoring

Where the dumps are, how to trust them, and how to put one back.

## Where they are

```bash
ssh vitalpair
ls -lt /var/backups/vitalpair/staging | head
```

One directory per environment under `/var/backups/vitalpair`. The last seven
dumps are kept; older ones are deleted by the script that writes them, because a
disk full of backups is a worse outage than the one they protect against.

The directory belongs to the deploying user. A fresh machine does not have it
and cannot create it, which is step 0b of the first-run instructions in
[deploy/README.md](../../deploy/README.md): the first deploy on the real server
stopped exactly there.

## When they are taken

| Trigger             | How                                                     |
| ------------------- | ------------------------------------------------------- |
| Before every deploy | `deploy.sh` calls `backup.sh` before anything else      |
| Nightly at 03:12    | `vitalpair-backup-<environment>.timer`, a systemd timer |

The nightly one catches up after a reboot rather than skipping the night. To
check it is armed, or to see what it did:

```bash
systemctl list-timers vitalpair-backup-staging.timer
journalctl -u vitalpair-backup-staging -n 20 --no-pager
```

To install or re-arm it, including after changing the hour:

```bash
cd ~/vitalpair && ./deploy/scripts/schedule-backups.sh staging
BACKUP_AT=04:30 ./deploy/scripts/schedule-backups.sh production
```

## Trusting a dump

`backup.sh` reads every dump back with `pg_restore --list` before keeping it, so
a file that exists has been parsed at least once. That is not the same as
knowing it restores, and the difference matters: a dump nobody has restored is a
belief, not a backup.

To actually prove one, restore it somewhere that is not the live database:

```bash
# A throwaway Postgres, same major version as production.
docker run -d --rm --name restore-probe -e POSTGRES_PASSWORD=probe postgres:16-alpine
sleep 5
docker exec -i restore-probe createdb -U postgres probe
docker exec -i restore-probe pg_restore -U postgres -d probe --no-owner \
  < /var/backups/vitalpair/staging/vitalpair-<stamp>.dump
docker exec restore-probe psql -U postgres -d probe -c 'select count(*) from users'
docker stop restore-probe
```

A count that matches what production has is the proof. Worth doing once a
release rather than once a year.

## Restoring for real

```bash
ssh vitalpair
cd ~/vitalpair/deploy
ls -lt /var/backups/vitalpair/staging | head
./scripts/restore.sh staging /var/backups/vitalpair/staging/vitalpair-<stamp>.dump
```

The script waits for the application's own healthcheck before saying it is done,
because `docker compose start` returns as soon as the process exists and the
first request after "restored" used to answer 502.

**Everything written after that dump is gone.** On staging that is test data. On
production it is meals people logged, weights they recorded, pairs they formed.
Read the timestamp on the dump and work out what window you are discarding
before running it, not after.

## What is not covered

- **Off-site copies.** The dumps sit on the same disk they protect, so a lost
  machine loses its backups too. Recorded as D-7 in
  [deployment.md](../features/deployment.md); it needs object storage.
- **Point-in-time recovery.** There is no WAL archiving, so the granularity is
  whatever dump is nearest, up to a day old.
- **Production.** It has never been started, so its timer has never run and its
  directory does not exist yet.
