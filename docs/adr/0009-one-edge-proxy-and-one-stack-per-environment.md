# ADR 0009: Deploy as one edge proxy per machine and one Compose stack per environment

- **Status**: Accepted
- **Date**: 2026-09-06
- **Deciders**: Alisson Souto
- **Supersedes**: the inherited `compose.prod.yaml` and `nginx/nginx.conf`
- **Superseded by**: nothing

## Context

Nothing is deployed and there is no server or domain yet, so the topology could
be designed from scratch. The inherited files were audited first and had ten
problems, one serious: the nginx configuration forwarded **everything** to the
backend, including `/actuator`, which would have exposed on the internet the
metrics that phase 8 moved to a separate port precisely to keep them private.
The rest: Postgres on a different major than the tests, no memory limits, no
log rotation, no health checks, no frontend image, HTTPS commented out, no
backup.

The target is one small VM (Oracle Cloud was the candidate) running staging
and production side by side, for one developer.

## Decision

Two Compose files with different lifetimes.

**`deploy/compose.edge.yaml`, one per machine.** nginx with TLS (Let's
Encrypt through certbot, renewed by a sidecar), HTTP to HTTPS redirect, HSTS, a
content security policy, `limit_req` on the authentication routes, and an
explicit `location /actuator { return 404; }`. It is the only thing that
publishes a port. It reaches the stacks over an external Docker network named
`vitalpair_edge`.

**`deploy/compose.app.yaml`, one per environment.** Postgres 16, Redis 7, the
backend and the frontend. Nothing publishes a port. Postgres and Redis sit on an
`internal` network the proxy cannot see. The backend and frontend join
`vitalpair_edge` under aliases `backend-${ENVIRONMENT}` and
`frontend-${ENVIRONMENT}`, which is what lets one proxy serve
`staging.<domain>` and `app.<domain>` from one machine. Every service has a
health check, a memory and CPU limit, and json-file logging capped at three
files of 10 MB.

Images are multi-stage: the backend jar is extracted into layers so a code
change does not re-ship the dependencies, and both images run as non-root.
Health checks use `127.0.0.1`, because `localhost` resolved to `::1` inside the
container and the check failed while the service was fine.

Scripts: `backup.sh` dumps and then **reads the dump back** with
`pg_restore --list`, deleting it and failing if it is corrupt; `deploy.sh` backs
up, pulls, starts, waits for health, runs `smoke.sh`, and rolls back to the
previous version on failure.

## Alternatives considered

### Option A: Caddy instead of nginx

Considered. Automatic TLS with less configuration. nginx was kept because the
`limit_req`, CSP and the actuator block were already understood, and the
certbot sidecar is a known quantity. Recorded as a reasonable alternative.

### Option B: one Compose file with everything, ports published on the host

Rejected. It is the inherited design, and it is how `/actuator` and the
database ended up one firewall rule away from the internet.

### Option C: Kubernetes, or a managed platform

Rejected. One VM, one developer, two environments. Compose is the amount of
orchestration the problem has.

### Option D: separate VMs for staging and production

Rejected for cost. The alias scheme gives isolation at the network level on one
machine; the stacks share only the proxy.

## Consequences

### What this makes easier

Staging and production differ by an env file and an alias. A database outage
cannot take the proxy down with it, because of the memory limits. A bad deploy
reverts itself.

### What this makes harder

One machine is one failure domain: staging load can affect production. Backups
live on the same disk they protect, so they survive a bad migration, not the
loss of the server. The JVM heap limit could not be verified on Docker Desktop
for Windows, where the container reported 2846 MB inside a 768 MB limit.

### What has to change

`Dockerfile`, `frontend/Dockerfile`, `frontend/nginx/default.conf`, the
`deploy/` tree, `.dockerignore`, and `compose.yaml` for development moving to
Postgres 16 (a local volume created on 15 needs `docker compose down -v`).

## Verification

Run locally on 2026-09-06 with a self-signed certificate: four containers
healthy, 24 migrations on an empty database, an account created over HTTPS
through the proxy, a full backup, destroy and restore cycle with the account
surviving, and a deliberately broken frontend image that `deploy.sh` rolled
back on its own. `smoke.sh` caught `/actuator` answering 200 through the SPA
catch-all before the explicit 404 existed.

Not verified: a real certificate issue and renewal, which needs a domain.

## References

- `deploy/README.md`
- Phase 11 pull request.
