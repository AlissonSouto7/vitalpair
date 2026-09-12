# Runbook: going back

The version that is live is wrong and the answer is the previous one. Written
for the person deciding that under pressure.

## Decide which kind of wrong it is

| What happened                               | What to do                                             |
| ------------------------------------------- | ------------------------------------------------------ |
| The deploy failed its smoke test            | Nothing. It already went back                          |
| The deploy passed, and the version is wrong | `rollback.sh`, below                                   |
| The bad version changed the database        | `rollback.sh` may not be enough. See the last section  |
| The site is down and no deploy happened     | This is not a rollback. See [incident.md](incident.md) |

`deploy.sh` rolls back on its own when the smoke test fails, so a red pipeline
usually means the site is already serving what it served before. The run's log
says which check failed.

## Going back one version

```bash
ssh <deploy-host>
cd ~/vitalpair/deploy
cat env/.deployed-staging env/.previous-staging   # read first: where you are, where you would land
./scripts/rollback.sh staging                     # or production
```

It swaps the two records, so the rollback is itself undoable: running it again
returns to the version you just left.

It does not touch the database.

## When there is nothing to go back to

`rollback.sh` refuses when `env/.previous-<environment>` does not exist, which
is the state after the very first deploy of an environment. There is no previous
image because there has never been one. The way out is forward: fix the code and
deploy again.

## When the bad version migrated the database

This is the case the image swap does not solve. A migration is forward-only, so
the previous image may face a schema it does not understand.

First ask whether it actually does. Migrations here are expand/contract by
rule: a column added, nothing dropped or renamed in the same release. If the bad
version only added things, the old image ignores them and a plain rollback
works.

If it genuinely does not, the dump taken before the deploy is the way back:

```bash
ls -lt /var/backups/vitalpair/staging | head
./scripts/restore.sh staging /var/backups/vitalpair/staging/vitalpair-<stamp>.dump
```

**A restore loses everything written since that dump.** On production that is
real people's data: meals they logged, weights they recorded. It is the last
resort, and it is worth spending ten minutes confirming the schema is genuinely
incompatible before spending it.

## Afterwards

- Say what happened in the pull request that shipped the bad version, so the
  next person reading it knows.
- A rollback is not a fix. The bad version is still on `main` and the next
  deploy will bring it back unless the cause is addressed.
- If the smoke test passed on a version that was wrong, the smoke test is
  missing a check. Adding it is part of the fix.
