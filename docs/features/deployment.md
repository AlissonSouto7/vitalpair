# Feature: deployment

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped, rehearsed on a developer machine; not yet run on a server
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-10

## What it is and where it lives

How the application reaches a server and stays there: the images, the proxy in
front of them, the stacks behind it, and the scripts that deploy, back up,
restore and roll back. The operator's manual is [deploy/README.md](../../deploy/README.md);
the reasoning is [ADR 0009](../adr/0009-one-edge-proxy-and-one-stack-per-environment.md).
This document holds what was verified, what was found, and what is not covered.

|                   |                                                                   |
| ----------------- | ----------------------------------------------------------------- |
| Frontend route    | none                                                              |
| Who can access it | the operator, over SSH on the machine                             |
| Backend package   | none; `application-prod.yaml` is the only backend file involved   |
| Feature flag      | `SWAGGER_ENABLED` (staging only) and which `*_SERVER_NAME` is set |

## Architecture

| Layer                  | Files                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Images                 | `Dockerfile` (layered jar, non-root, healthcheck on 9090), `frontend/Dockerfile` (unprivileged nginx on 8080), `.dockerignore` |
| Edge                   | `deploy/compose.edge.yaml`; `deploy/nginx/templates/00-shared.conf.template` (resolver, rate-limit zone)                       |
| One site per env       | `deploy/nginx/site.conf.template`, rendered by `deploy/nginx/docker-entrypoint.d/15-render-sites.sh` for each name set         |
| Per-environment extras | `deploy/nginx/extras/staging.conf` (Swagger, Grafana, basic auth), `deploy/nginx/extras/production.conf` (404)                 |
| Proxy headers          | `deploy/nginx/proxy_params.conf`                                                                                               |
| Application stack      | `deploy/compose.app.yaml` (Postgres 16, Redis 7, backend, frontend; nothing published)                                         |
| Monitoring             | `deploy/compose.monitoring.yaml` (see [observability.md](observability.md))                                                    |
| Configuration          | `deploy/env/{edge,staging,production}.env.example`; the filled-in files and `htpasswd` never leave the machine                 |
| Scripts                | `deploy/scripts/{deploy,rollback,backup,restore,smoke,certbot-init,selfsigned,htpasswd}.sh`                                    |
| CI                     | `.github/workflows/ci.yml`, job `Container images`: builds both images and boots the backend one against a real database       |

### What the edge does with each path

| Path                                               | Staging site                               | Production site            |
| -------------------------------------------------- | ------------------------------------------ | -------------------------- |
| `:80 /.well-known/acme-challenge/`                 | served from the certbot volume             | same                       |
| `:80` anything else                                | 301 to https                               | same                       |
| `/api/`                                            | `backend-staging:8080`, 120 s read timeout | `backend-production:8080`  |
| `/api/v1/auth/`                                    | same, plus `limit_req` 10 r/min, burst 20  | same                       |
| `/actuator`                                        | 404                                        | 404                        |
| `/swagger-ui/`, `/swagger-ui.html`, `/v3/api-docs` | basic auth, then the backend               | 404                        |
| `/grafana/`                                        | basic auth, then `grafana:3000`            | 404                        |
| `/`                                                | `frontend-staging:8080`                    | `frontend-production:8080` |

## Business rules

| #    | Rule                                                                                          | Why                                                                                                                                                                                                                                   |
| ---- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1  | Only the edge publishes a port                                                                | Postgres, Redis and the management port stay off the public interface. A container on the edge network cannot even resolve `postgres`                                                                                                 |
| R-2  | The edge resolves upstreams per request, through Docker's DNS                                 | With a literal host nginx keeps the address it found at startup; a backend recreated by a deploy comes back elsewhere and the proxy answers 502 until reloaded (D-1)                                                                  |
| R-3  | One site per environment, rendered only when its name is set                                  | A machine serving only staging must not need a production certificate, and nginx must start with the other stack absent                                                                                                               |
| R-4  | A deploy never builds; both images must exist after the pull                                  | Compose builds a missing image from whatever source is on the machine, so a mistyped tag would deploy code nobody chose (D-2)                                                                                                         |
| R-5  | Backup before every deploy; every dump is read back with `pg_restore --list`; keep the last 7 | A migration is forward-only, so the dump is the only way back from a wrong one; a dump nobody can restore is worse than none, because it is trusted; a disk full of dumps is a worse outage than the one they protect against         |
| R-6  | The smoke test decides; on failure the previous good version comes back on its own            | Containers reporting healthy is not the site working: a proxy routing to the wrong place or a frontend without its files both look healthy                                                                                            |
| R-7  | Two records per environment, current and previous; `rollback.sh` swaps them                   | A deploy that passed the smoke test can still be wrong an hour later, and a rollback must itself be undoable                                                                                                                          |
| R-8  | Swagger and Grafana exist only on staging, behind basic auth; production answers 404          | The API documentation maps every endpoint and payload; the dashboards show how the product is used. A 404 rather than a fall-through, because the SPA's catch-all would answer 200 and look, from outside, like something being there |
| R-9  | The basic-auth header is stripped before proxying to the extras                               | Grafana reads `Authorization: Basic` as one of its own logins and refuses every request                                                                                                                                               |
| R-10 | A restore waits for the application to be healthy before saying it is done                    | `docker compose start` returns as soon as the process exists; the first request after "restored" answered 502 while the backend was still booting (D-3)                                                                               |
| R-11 | The edge's health is whether nginx answers, not whether a stack behind it does                | A proxy is not unhealthy because an environment it fronts is down; the previous check fetched `/` over TLS and would have flagged the proxy for someone else's outage                                                                 |

## Security findings

### Fixed

| ID  | Severity | File                                                  | What happened                                                                                                                                                                                                                                         | Measured impact                                                                                                                                                                               | Fix                                                                                                                                                                                                                   |
| --- | -------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1 | Medium   | `deploy/nginx/templates/default.conf.template` (gone) | `proxy_pass http://backend-staging:8080` resolved once at startup. Forced the backend onto another address (stopped it, let another container take `172.21.0.4`, started it on `.5`): nginx kept sending to `.4`, `connect() failed (111)` in its log | 3 of 3 requests answered 502 with the backend healthy. On a server, every deploy that recreates the backend would do this until the daily reload, or someone noticed                          | `resolver 127.0.0.11 valid=10s` and the upstreams in variables (`site.conf.template`). Verified: the backend moved again with nginx already running, 3 of 3 answered 401                                              |
| D-2 | Medium   | `deploy/scripts/deploy.sh`                            | `compose pull` failed for a tag that did not exist, the script carried on "using the local images", and `compose up` **built** one from the source on the machine because the service declares `build:`. The deploy passed its smoke test             | A tag that does not exist anywhere was deployed successfully as a fresh build of whatever the checkout held. Found in the rehearsal: `vitalpair-frontend:broken` came up as the real frontend | Both images are checked with `docker image inspect` after the pull, and `up` runs with `--no-build`; `rollback.sh` the same. Verified: `vitalpair-frontend:does-not-exist` refused, stack untouched, no state written |
| D-3 | Low      | `deploy/scripts/restore.sh`                           | "restored" was printed as soon as the backend process was started                                                                                                                                                                                     | The first request after a restore answered 502; the person doing the restore, on a bad day already, would read that as the restore having broken the site                                     | Waits up to three minutes for the container's own healthcheck, and fails with the log command if it never comes                                                                                                       |
| D-4 | Low      | `deploy/env/production.env.example`                   | A botched edit had left the e-mail comment interleaved with `MAIL_ENABLED=true` in the middle of a sentence                                                                                                                                           | Whoever copied the example would have had to guess which line was the setting                                                                                                                 | Rewritten                                                                                                                                                                                                             |

### Open

| ID  | Severity | File                             | What happens                                                                                                     | Measured impact                                                                               | Why it is still open                                                                                                                  |
| --- | -------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| D-5 | Low      | `deploy/nginx/proxy_params.conf` | `Connection ""` is set for keep-alive, so the WebSocket upgrade Grafana's live features ask for is not forwarded | Not measured. Dashboards refresh on their interval; live streaming would fall back to polling | Grafana on staging is a diagnostic tool, not a product surface; a separate location with the upgrade headers is cheap when it matters |
| D-6 | Info     | `deploy/scripts/htpasswd.sh`     | Passwords are hashed with apr1, which is MD5-based, because the stock nginx image has no bcrypt                  | Nothing without the file, which never leaves the machine and is mode 600                      | The file protects a staging page over TLS with a 12-character minimum; a stronger hash needs a different nginx build                  |
| D-7 | Low      | `deploy/compose.app.yaml`        | Backups live on the same disk they protect                                                                       | A lost machine loses its backups                                                              | Off-site copies (object storage) are backlog; the deploy has no server yet                                                            |

### Verified and fine

| Check                                                    | How it was verified                                                                                                                                                                 | Date       |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Postgres and Redis unreachable from the edge network     | `nc -z postgres 5432` from a container on `vitalpair_edge`: the name does not resolve                                                                                               | 2026-09-10 |
| The management port is reachable only inside the network | `docker port` on the backend and Postgres containers is empty; `backend-staging:9090` answers from the edge network, which is what Prometheus scrapes, and the edge never routes it | 2026-09-10 |
| `/actuator` is 404 on both sites                         | `smoke.sh` on staging; direct probe on the production site                                                                                                                          | 2026-09-10 |
| Both images run as an ordinary user                      | `id -u` in the backend container is 100 (`app`); the frontend runs as `nginx`                                                                                                       | 2026-09-10 |
| No secret in the repository                              | `git status` after the rehearsal shows only the `.example` files; `htpasswd`, `.deployed-*` and `.previous-*` are ignored                                                           | 2026-09-10 |
| Security headers are not duplicated by the two nginx     | `curl -I` through the edge: one `X-Frame-Options`, one `Strict-Transport-Security`                                                                                                  | 2026-09-10 |
| Basic-auth credentials do not reach Grafana              | `/grafana/login` answers 200 with the login page when the nginx credentials are given; with the header passed through Grafana would answer 401                                      | 2026-09-10 |
| Swagger is closed by default and opens only by the flag  | `SwaggerDisabledInProdIT` (404) and `SwaggerEnabledByFlagIT` (200), both on the `prod` profile                                                                                      | 2026-09-10 |

## Tests

| Test                                 | Type           | Risk it covers                                                                                                                                                                                         |
| ------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SwaggerDisabledInProdIT` (2)        | integration    | The production profile serving the API documentation; health leaving the management port. Also the only test that parses `application-prod.yaml`                                                       |
| `SwaggerEnabledByFlagIT` (1)         | integration    | Staging finding out at deploy time that the flag does nothing. Red before the placeholder existed: `expected 200 OK but was 404`                                                                       |
| CI job `Container images`            | integration    | The backend image failing to boot against a real Postgres and Redis; the frontend image serving nothing                                                                                                |
| `deploy/scripts/smoke.sh` (8 checks) | e2e, read-only | Site down, deep link 404, API unguarded, login broken, metrics or health exposed, plain HTTP served, HSTS missing. Caught the broken frontend in the rehearsal (`a deep link serves the app: got 404`) |
| The rehearsal in `deploy/README.md`  | manual         | Everything the scripts do, end to end, on a machine without a domain                                                                                                                                   |

```bash
./mvnw verify -Dit.test='SwaggerDisabledInProdIT,SwaggerEnabledByFlagIT'
SMOKE_HTTP_URL=http://localhost:18080 deploy/scripts/smoke.sh https://localhost:18443
```

**What the rehearsal of 2026-09-10 proved**, each from a command whose output
was read: edge, four staging containers and the two monitoring containers
healthy; the smoke test's eight checks green through the edge; the backend moved
to a new address twice with nginx running and kept answering; Swagger and Grafana
401 without credentials and 200 with; the production site rendered beside
staging with its stack absent (502 on the application, 404 on the extras,
staging untouched); Prometheus reporting `backend-staging:9090` as `up`; a
nonexistent tag refused; `v1` deployed; a deliberately broken frontend caught by
the smoke test and rolled back on its own; `v2` deployed and rolled back by hand
with the two records swapped; the database truncated (0 users) and restored
from the dump (1 user, the right e-mail); seven dumps kept.

### What is not covered

- **Issuing and renewing a real certificate.** `certbot-init.sh` was not run:
  it needs a domain pointing at a machine on the internet.
- **Two application stacks running at once.** The production site was probed with
  its stack absent. The rehearsal machine gives Docker 3.98 GB, and staging with
  monitoring already uses most of it.
- **The daily `nginx -s reload`** by the `nginx-reloader` container, and the
  twice-daily `certbot renew`, both of which only matter with a real certificate.
- **The nginx rate limit answering 429.** The application's own limiter answers
  first on the login route, so telling the two apart needs a route only nginx
  limits.
- **An ARM build.** The images were built and run on `amd64`; Oracle's free A1
  shape is `arm64`, where the same Dockerfiles must be built on the machine.
- **The JVM heap following the container limit**, which Docker Desktop for
  Windows does not expose to the JVM.

## How to verify in production

```bash
# read only: every container healthy, nothing published but 80 and 443
docker ps --format '{{.Names}} {{.Status}} {{.Ports}}'

# read only: which sites the edge serves, and that its configuration is valid
docker logs vitalpair-edge-nginx-1 2>&1 | grep 'edge:'
docker exec vitalpair-edge-nginx-1 nginx -t

# read only: the eight checks, against the public name
deploy/scripts/smoke.sh https://staging.your.domain

# read only: the last deploy and the one before it
cat deploy/env/.deployed-staging deploy/env/.previous-staging

# read only: backups exist, are recent, and are not growing without bound
ls -lt /var/backups/vitalpair/staging | head
```

## Known debt

| Item                                       | Impact                                                      | When it is meant to be addressed                        |
| ------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------- |
| Not run on a server                        | Certificate issue and renewal unverified                    | The first real deploy, which needs the VM and a domain  |
| Images are built on the machine            | A deploy depends on the checkout and on the machine's CPU   | Phase 12: CI publishes the images it already builds     |
| Deploys are manual                         | A person runs `deploy.sh` over SSH                          | Phase 12                                                |
| D-5, D-6, D-7                              | See "Open"                                                  | When there is a server; D-7 needs object storage        |
| The rehearsal is a checklist, not a script | Verifying a change to `deploy/` takes a person half an hour | A `rehearse.sh` that runs the sequence above end to end |

## History

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                         | Pull request         |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 2026-09-06 | The deployment stack built, replacing the inherited one that forwarded `/actuator` to the internet. Rehearsed locally with a self-signed certificate                                                                                                                                                                                                                                           | `49f6443`            |
| 2026-09-08 | Scripts marked executable in git                                                                                                                                                                                                                                                                                                                                                               | #62                  |
| 2026-09-09 | Prometheus and Grafana stack                                                                                                                                                                                                                                                                                                                                                                   | #68                  |
| 2026-09-10 | Phase 11 closed as far as a machine without a domain allows: one site per environment on one edge, upstreams resolved per request (D-1), a deploy that never builds (D-2), Swagger on staging behind basic auth and 404 in production, `/grafana/` through the edge, `rollback.sh`, `selfsigned.sh` and `htpasswd.sh`, a restore that waits (D-3). Rehearsed end to end, this document created | `infra/staging-prod` |
