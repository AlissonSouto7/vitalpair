# Deploying VitalPair

Everything needed to run this on a server, and what to do when something goes
wrong at three in the morning.

## The shape of it

Two compose files, on purpose.

`compose.edge.yaml` is the **edge**: one per machine. It owns ports 80 and 443,
holds the certificates, and is the only thing the internet can reach.

`compose.app.yaml` is an **application stack**: database, cache, API and
interface. The same file runs staging and production; what differs is the env
file. Nothing in it publishes a port. The two stacks join a shared network and
are reached by the aliases `backend-staging` and `backend-production`, which is
what lets both live on one machine without either being exposed.

```
internet → :443 edge nginx ─┬─ /api/  → backend-<env>:8080
                            └─ /      → frontend-<env>:8080

                internal network (no route from the edge)
                            └─ postgres, redis
```

## First run on a new machine

```bash
# 1. The edge, which creates the shared network the stacks join.
cp deploy/env/edge.env.example deploy/env/edge.env    # set SERVER_NAME
docker compose -f deploy/compose.edge.yaml --env-file deploy/env/edge.env up -d

# 2. The certificate. Point DNS at this machine first, or the challenge fails.
#    Leave STAGING=1 for the first attempt: Let's Encrypt allows five failures an
#    hour for a domain, and a DNS record that has not propagated burns them fast.
deploy/scripts/certbot-init.sh your.domain you@example.com
STAGING=0 deploy/scripts/certbot-init.sh your.domain you@example.com

# 3. An application stack.
cp deploy/env/staging.env.example deploy/env/staging.env
#    Generate each secret rather than inventing one:
openssl rand -base64 48
docker compose -f deploy/compose.app.yaml --env-file deploy/env/staging.env up -d --wait

# 4. Prove it works before telling anyone about it.
deploy/scripts/smoke.sh https://your.domain
```

## Deploying a new version

```bash
deploy/scripts/deploy.sh staging <backend image> <frontend image>
```

In order: back up, pull, start, smoke test. If the smoke test fails it rolls back
to the version last recorded as good and says so. If the rollback also fails, the
schema has probably moved forward under a migration the old image does not
understand, and the backup taken at the start is the way out.

The backup comes first for a reason. Rolling an image back does not undo a
migration: a dropped column stays dropped.

## Backups

```bash
deploy/scripts/backup.sh production                     # also runs before every deploy
deploy/scripts/restore.sh production <dump file>        # asks before destroying
```

Keeps the last seven by default (`BACKUP_KEEP`). Each dump is verified readable
immediately after being written: a backup nobody can restore is worse than none,
because it is trusted.

Put it in cron so it does not depend on a deploy happening:

```cron
0 3 * * * /path/to/vitalpair/deploy/scripts/backup.sh production
```

## When something is wrong

```bash
# What is actually running, and is it healthy?
docker compose -f deploy/compose.app.yaml --env-file deploy/env/production.env ps

# The application's own view. The request id in an error the user reports appears here.
docker compose -f deploy/compose.app.yaml --env-file deploy/env/production.env logs backend --tail=200

# Metrics and health, from this machine only: they are deliberately not routed by the edge.
docker compose -f deploy/compose.app.yaml --env-file deploy/env/production.env \
  exec backend curl -s localhost:9090/actuator/health

# Is the certificate still valid?
curl -vI https://your.domain 2>&1 | grep -iE 'expire|subject|issuer'
```

## Choices worth knowing

**Nothing but the edge is published.** Postgres and Redis are on an internal
network the proxy cannot even resolve. Verified: a container on the edge network
cannot reach `postgres:5432`.

**`/actuator` returns 404 at the edge.** Phase 8 moved health and metrics to
their own port so that publishing the API would not publish a live readout of the
system. Refusing the path outright matters, rather than merely not routing it:
the single-page application's catch-all otherwise answers `/actuator/prometheus`
with `index.html` and a 200, which from outside is indistinguishable from an
exposed endpoint. The smoke test checks this, and caught exactly that mistake.

**Every container has a memory limit and rotating logs.** Without limits one
runaway query takes the machine down, proxy included, so a database problem
becomes a total outage. Without rotation the disk fills silently and the first
symptom is everything failing at once.

**The proxy passes `X-Forwarded-For`.** Without it every request reaches the
application from the proxy's address, so the per-IP rate limiter counts the whole
internet as one caller and a single abusive visitor locks everybody out.

**The images run as an ordinary user.** Verified: the backend runs as `app`, the
frontend as `nginx`.

## Known gaps

- **Not yet run on a real server.** Everything here was exercised on a
  development machine with a self-signed certificate: containers healthy, routing,
  headers, backup, restore, and a deliberately broken deploy rolling back. What
  a real domain adds, and what is therefore unverified, is the certificate issue
  and its renewal.
- **The JVM heap limit could not be verified locally.** Inside a container limited
  to 768 MB the JVM reports a 2846 MB heap, and the same happens with `--memory`
  passed directly, so it is Docker Desktop for Windows not exposing the cgroup
  limit rather than a mistake in the configuration. On a Linux host, which is
  where this deploys, `MaxRAMPercentage` is honoured. Check it there:
  `docker exec <container> java -XX:+PrintFlagsFinal -version | grep MaxHeapSize`
- **No off-site copy.** A backup on the same machine survives a bad migration, not
  a lost machine.
- **No monitoring.** Prometheus is exposed on 9090 and nothing scrapes it yet.
- **Deploys are manual.** Phase 12 turns `deploy.sh` into a pipeline.
