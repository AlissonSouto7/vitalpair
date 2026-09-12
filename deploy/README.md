# Deploying VitalPair

Everything needed to run this on a server, and what to do when something goes
wrong at three in the morning. The reasoning behind the shape is in
[ADR 0009](../docs/adr/0009-one-edge-proxy-and-one-stack-per-environment.md);
what was verified, and what was not, is in
[docs/features/deployment.md](../docs/features/deployment.md).

## The shape of it

Three compose files, on purpose.

`compose.edge.yaml` is the **edge**: one per machine. It owns ports 80 and 443,
holds the certificates, and is the only thing the internet can reach. It serves
one site per environment whose name is set in `edge.env`: a machine with only
`STAGING_SERVER_NAME` filled in has only staging.

`compose.app.yaml` is an **application stack**: database, cache, API and
interface. The same file runs staging and production; what differs is the env
file. Nothing in it publishes a port. The stacks join a shared network and are
reached by the aliases `backend-staging` and `backend-production`, which is what
lets both live on one machine without either being exposed.

`compose.monitoring.yaml` is Prometheus and Grafana, for staging only, reached
through the edge at `/grafana/` behind basic auth.

```
internet → :443 edge nginx ─┬─ staging.<domain>  ─┬─ /api/       → backend-staging:8080
                            │                     ├─ /           → frontend-staging:8080
                            │                     ├─ /swagger-ui/, /v3/api-docs  (basic auth) → backend-staging
                            │                     └─ /grafana/   (basic auth) → grafana:3000
                            └─ app.<domain>      ─┬─ /api/       → backend-production:8080
                                                  ├─ /           → frontend-production:8080
                                                  └─ /swagger-ui/, /v3/api-docs, /grafana/ → 404

                internal network (no route from the edge)
                            └─ postgres, redis, one pair per stack
```

## First run on a new machine

```bash
# 0. Docker, and the repository. The scripts run from it.
git clone https://github.com/AlissonSouto7/vitalpair.git && cd vitalpair

# 0b. Somewhere to put the dumps. `deploy.sh` backs up before touching anything and
#     runs as an ordinary user, who cannot create a directory under /var/backups.
#     Without this the first deploy stops before it starts anything.
sudo mkdir -p /var/backups/vitalpair && sudo chown "$(id -un):$(id -gn)" /var/backups/vitalpair

# 1. Who may open the staging extras (Swagger, Grafana). Before the edge starts:
#    the file is mounted into it, and a file that does not exist yet would be
#    mounted as an empty directory.
deploy/scripts/htpasswd.sh <user>

# 2. A placeholder certificate for each name the edge will serve. nginx refuses to
#    start without a certificate file, and certbot needs nginx running to answer
#    the challenge; the placeholder breaks that circle and is replaced in step 4.
deploy/scripts/selfsigned.sh staging.your.domain

# 3. The edge, which creates the shared network the stacks join.
cp deploy/env/edge.env.example deploy/env/edge.env    # set STAGING_SERVER_NAME (and PRODUCTION_SERVER_NAME later)
docker compose -f deploy/compose.edge.yaml --env-file deploy/env/edge.env up -d

# 4. The real certificate, one per name. Point DNS at this machine first, or the
#    challenge fails. Leave STAGING=1 for the first attempt: Let's Encrypt allows
#    five failures an hour for a domain, and a DNS record that has not propagated
#    burns them fast.
deploy/scripts/certbot-init.sh staging.your.domain you@example.com
STAGING=0 deploy/scripts/certbot-init.sh staging.your.domain you@example.com

# 5. An application stack.
cp deploy/env/staging.env.example deploy/env/staging.env
#    Generate each secret rather than inventing one:
openssl rand -base64 48
docker compose -f deploy/compose.app.yaml --env-file deploy/env/staging.env up -d --wait

# 6. Monitoring, staging only.
docker compose -f deploy/compose.monitoring.yaml --env-file deploy/env/staging.env up -d --wait

# 7. Prove it works before telling anyone about it.
deploy/scripts/smoke.sh https://staging.your.domain
```

Production is the same machine, later: set `PRODUCTION_SERVER_NAME` in
`edge.env`, `up -d` the edge again (it re-renders its sites), issue that name's
certificate, and start a second stack from `production.env`. Until then the
production name simply does not exist on the machine.

The first stack start needs images. Either build them on the machine
(`docker compose -f deploy/compose.app.yaml --env-file deploy/env/staging.env build`)
or point `BACKEND_IMAGE` and `FRONTEND_IMAGE` at a registry; the pipeline is what
makes CI publish them. Building on the machine is the right answer on an ARM
server (Oracle's A1 shape), because the images CI builds today are `amd64`.
Every base image has to exist for `arm64`, and one did not: Temurin's Alpine JRE
is amd64 only, which the first real build found. CI now asks the registry about
every `FROM` line, so the next such mistake fails the pull request rather than
the server.

## Sending e-mail

The application sends two e-mails, both part of authentication: the password
reset link and the address verification link. With `MAIL_ENABLED=false` neither
is sent and the flow cannot be completed, which is the right default for a stack
that has no provider yet.

To turn it on, fill in five variables in the environment file and restart the
backend:

```
MAIL_ENABLED=true
MAIL_FROM=VitalPair <contato@your.domain>
SPRING_MAIL_HOST=smtp-relay.brevo.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=<the provider's login>
SPRING_MAIL_PASSWORD=<the provider's key, never in git>
```

The link inside the e-mail is built from `PUBLIC_URL`, which the compose file
passes as `FRONTEND_URL`. A stack whose `PUBLIC_URL` is wrong sends links that
lead nowhere, and nothing in the logs says so.

Two things the provider needs before it will deliver anything:

- **The domain has to be authenticated**, by DKIM, DMARC, or both. Mail sent as
  a domain that has not proven it owns the sender lands in spam when it is not
  refused outright.
- **Never add a second SPF record.** Two of them on one domain invalidate each
  other and break sending and receiving together. If a provider asks for an SPF
  include and one already exists, merge them into the single existing line.

Verify it by asking for a password reset and reading the log: the adapter writes
the address it sent to and never the link, because the link carries a token that
takes over the account.

## Deploying a new version

```bash
deploy/scripts/deploy.sh staging <backend image> <frontend image>
```

In order: back up, pull, refuse to continue if either image does not exist after
the pull, start without building, smoke test. If the smoke test fails it rolls
back to the version last recorded as good and says so. If the rollback also
fails, the schema has probably moved forward under a migration the old image does
not understand, and the backup taken at the start is the way out.

The backup comes first for a reason. Rolling an image back does not undo a
migration: a dropped column stays dropped.

A deploy never builds. Without that rule a mistyped tag would make compose build
an image from whatever source is on the machine and deploy it, successfully; it
happened in a rehearsal, which is why the check exists.

```bash
deploy/scripts/rollback.sh staging
```

For the deploy that passed the smoke test and turned out wrong anyway. It goes
to the version the last deploy replaced (`env/.previous-<environment>`), runs the
smoke test, and swaps the two records so the rollback can itself be undone.

## Backups

```bash
deploy/scripts/backup.sh production                     # also runs before every deploy
deploy/scripts/restore.sh production <dump file>        # asks before destroying
```

Keeps the last seven by default (`BACKUP_KEEP`). Each dump is verified readable
immediately after being written: a backup nobody can restore is worse than none,
because it is trusted. A restore stops the application, replaces the database,
starts the application again and waits for it to report healthy before saying
so.

Put it in cron so it does not depend on a deploy happening:

```cron
0 3 * * * /path/to/vitalpair/deploy/scripts/backup.sh production
```

## Rehearsing on a developer machine

The whole thing runs on a laptop with no domain, which is how every change to
this directory is verified before it reaches a server.

```bash
# A certificate nobody trusts, in the place the edge expects the real one.
MSYS_NO_PATHCONV=1 deploy/scripts/selfsigned.sh localhost      # the MSYS variable only matters on Git Bash

# edge.env: STAGING_SERVER_NAME=localhost, and the ports, because 80 and 443 are
# usually taken on a developer machine:
#   EDGE_HTTP_PORT=18080
#   EDGE_HTTPS_PORT=18443
# staging.env: PUBLIC_URL=https://localhost:18443

PASSWORD=some-long-password deploy/scripts/htpasswd.sh me
docker compose -f deploy/compose.edge.yaml --env-file deploy/env/edge.env up -d
docker compose -f deploy/compose.app.yaml --env-file deploy/env/staging.env up -d --build --wait

# The plain-HTTP check needs to know the odd port; everything else follows PUBLIC_URL.
SMOKE_HTTP_URL=http://localhost:18080 deploy/scripts/smoke.sh https://localhost:18443

# deploy.sh and rollback.sh read the same variable, and backups go somewhere writable:
export SMOKE_HTTP_URL=http://localhost:18080 BACKUP_DIR=/tmp/vitalpair-backups
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

# Which sites the edge rendered at startup, and is its configuration valid?
docker logs vitalpair-edge-nginx-1 2>&1 | grep 'edge:'
docker exec vitalpair-edge-nginx-1 nginx -t

# Is the certificate still valid?
curl -vI https://your.domain 2>&1 | grep -iE 'expire|subject|issuer'
```

## Choices worth knowing

**Nothing but the edge is published.** Postgres and Redis are on an internal
network the proxy cannot even resolve. Verified: a container on the edge network
cannot reach `postgres:5432`.

**The edge resolves its upstreams per request.** With a literal host in
`proxy_pass`, nginx looks the address up once, at startup, and keeps it. A
backend recreated by a deploy comes back on another address, and the proxy keeps
sending to the old one: measured, three requests in a row answered 502 with the
backend healthy. The sites keep their upstreams in variables and use Docker's
resolver, so nginx asks again; the same change lets it start while a stack is
down.

**`/actuator` returns 404 at the edge.** An earlier pass moved health and metrics to
their own port so that publishing the API would not publish a live readout of the
system. Refusing the path outright matters, rather than merely not routing it:
the single-page application's catch-all otherwise answers `/actuator/prometheus`
with `index.html` and a 200, which from outside is indistinguishable from an
exposed endpoint. The smoke test checks this, and caught exactly that mistake.

**Swagger and Grafana exist only on staging, behind basic auth.** The API
documentation is a complete map of every endpoint and payload shape, and the
dashboards show how the product is used. Staging turns Swagger on through
`SWAGGER_ENABLED`; the edge puts `auth_basic` in front of both and strips the
credentials before proxying, because Grafana would read them as one of its own
logins. On the production site the same paths answer 404.

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
  development machine with a self-signed certificate, most recently on
  2026-09-10: containers healthy, routing for two sites, headers, the extras
  behind basic auth, backup, restore, a deliberately broken deploy rolling back
  on its own and a manual rollback. What a real domain adds, and what is
  therefore unverified, is the certificate issue and its renewal.
- **The two application stacks were not run side by side.** The production site
  was rendered and probed with its stack absent (502 on the application, 404 on
  the extras), which proves the edge tolerates it; running both stacks needs more
  memory than the rehearsal machine gives Docker.
- **The JVM heap limit could not be verified locally.** Inside a container limited
  to 768 MB the JVM reports a 2846 MB heap, and the same happens with `--memory`
  passed directly, so it is Docker Desktop for Windows not exposing the cgroup
  limit rather than a mistake in the configuration. On a Linux host, which is
  where this deploys, `MaxRAMPercentage` is honoured. Check it there:
  `docker exec <container> java -XX:+PrintFlagsFinal -version | grep MaxHeapSize`
- **No off-site copy.** A backup on the same machine survives a bad migration, not
  a lost machine.
- **Grafana's live updates fall back to polling** through the proxy, which does
  not forward the WebSocket upgrade. Dashboards still refresh on their interval.
- **Deploys are manual.** An earlier pass turns `deploy.sh` into a pipeline and makes CI
  publish the images it already builds.
