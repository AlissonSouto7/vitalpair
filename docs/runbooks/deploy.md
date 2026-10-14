# Runbook: deploying

What happens when code reaches a server, what to do when it does not, and how to
put it back. Written to be followed at three in the morning by someone who did
not write the pipeline.

## How a deploy starts

| Trigger           | What it deploys | Approval                              |
| ----------------- | --------------- | ------------------------------------- |
| A merge to `main` | staging         | none; it runs on its own              |
| A tag `v*`        | production      | a person has to approve it in the run |

Both run the same jobs in the same order: the full test suite, then the images,
then the deploy. The images are built once, on arm64, and tagged with the commit
they came from, so a tag deploys the exact bytes that were on staging rather
than a rebuild of the same source.

## Watching one

The run is under Actions, named CD. The deploy job writes a summary saying which
commit and which images the server reports running, which is the fastest answer
to "is this version actually up".

After it finishes, ask the site rather than the pipeline:

```bash
deploy/scripts/smoke.sh https://staging.vitalpair.app
```

## When it fails

**The smoke test failed.** `deploy.sh` has already put the previous version back
and the job is red. The site is serving what it served before. Read the run's
log for which check failed, fix it, deploy again. Nothing to undo.

**The deploy failed before the smoke test**, while pulling or starting. Nothing
changed: the old containers are still running, because compose replaces them
only once the new ones are ready. The usual cause is an image that does not
exist, which the script refuses rather than working around by building one.

**It passed, and the version is wrong anyway.** Noticed by a person, an hour
later. Roll back by hand:

```bash
ssh <deploy-host>
cd ~/vitalpair/deploy
./scripts/rollback.sh staging       # or production
```

That goes to the version recorded as the previous good one. It does not touch
the database.

**The bad version ran a migration.** A rollback of the code alone may then face
a schema it does not understand. This is why migrations are expand/contract: the
previous version has to work against the new schema. When it genuinely does not,
the backup taken before the deploy is the way out:

```bash
ls -lt /var/backups/vitalpair/staging | head
./scripts/restore.sh staging /var/backups/vitalpair/staging/vitalpair-<stamp>.dump
```

A restore loses everything written since the dump. On production that is real
user data, so it is the last resort, not the first.

## First production deploy

Production has never run. It needs, once:

- `PRODUCTION_SERVER_NAME=vitalpair.app` and `PRODUCTION_SERVER_ALIASES=www.vitalpair.app`
  in `deploy/env/edge.env`, then the edge started again so it renders the second site. The
  bare domain is the product's address; the alias answers and redirects to it, because a
  name that resolves and then refuses is worse than one that does not resolve.
- A certificate covering **both** names, and a placeholder before it: nginx will not
  start without the file the site config names, and the alias server reads the canonical
  name's certificate. The canonical name goes first, because certbot names the `live/`
  directory after the first `-d` and that is the directory nginx reads:

  ```bash
  # On the machine, after DNS points both names here and the edge is up on port 80.
  deploy/scripts/selfsigned.sh vitalpair.app

  # Staging service first: five real failures an hour for a domain and you are locked out.
  deploy/scripts/certbot-init.sh vitalpair.app contato@vitalpair.app www.vitalpair.app
  STAGING=0 deploy/scripts/certbot-init.sh vitalpair.app contato@vitalpair.app www.vitalpair.app
  ```

  The script checks that every name answers before it asks, and prints the `curl` that
  proves the alias returns 301 to the bare domain.

- `deploy/env/production.env` with its own secrets, generated on the machine.
- The two stacks then run side by side on the same host.

## What this pipeline does not do

- **It does not check the database first.** A migration that locks a large table
  will do so, and the deploy will wait.
- **It does not stagger.** One backend container goes down and another comes up,
  so there is a gap of a few seconds. Zero-downtime needs two of everything.
- **It does not test production after deploying.** The smoke test runs, which is
  read-only and shallow by design: nothing writes to a production database from
  a pipeline.
