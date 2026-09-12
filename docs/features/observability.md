# Feature: observability and resilience

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-12

## What it is and where it lives

Three things that only matter once the application runs somewhere other than a
laptop: knowing which request a user is complaining about, seeing what the system
is doing without asking it, and surviving a partner API that is down.

|                   |                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| Frontend route    | none                                                                                           |
| Who can access it | operators, on the management port; the request id reaches every user in an error body          |
| Backend package   | `com.aps.vitalpair.shared.web`, `com.aps.vitalpair.shared.metrics`, `com.aps.vitalpair.config` |
| Feature flag      | none                                                                                           |

## Architecture

| Layer             | Files                                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Request id        | `shared/web/CorrelationIdFilter.java`, `shared/web/RequestContext.java`                                                                            |
| Error envelope    | `shared/web/ApiErrors.java`, `shared/web/ApiError.java`, `shared/web/JsonAuthenticationEntryPoint.java`                                            |
| Business metrics  | `shared/metrics/AiMetrics.java`                                                                                                                    |
| Resilience        | `application.yaml` (`resilience4j`), `ai/infrastructure/client/PlanAiGateway.java`, `nutrition/infrastructure/client/OpenFoodFactsHttpClient.java` |
| Scheduled jobs    | `config/SchedulingConfig.java`, `notification/application/scheduler/NotificationScheduler.java`, `db/migration/V24__create_shedlock.sql`           |
| Ports and logging | `application.yaml` (`management`), `application-prod.yaml` (ECS JSON), `application-dev.yaml` (pattern)                                            |

### Endpoints

| Method | Path                   | Port | Who can call it               |
| ------ | ---------------------- | ---- | ----------------------------- |
| GET    | `/actuator/health`     | 9090 | anyone who can reach the port |
| GET    | `/actuator/info`       | 9090 | anyone who can reach the port |
| GET    | `/actuator/prometheus` | 9090 | anyone who can reach the port |

Nothing under `/actuator` is served on 8080/8081 any more. The management port is
bound inside the container network and never mapped by the reverse proxy, which
is where access control for it lives; see the note under "Security findings".

## Business rules

- **Every request has an id, and the user sees it.** `X-Request-Id` is generated
  when absent, echoed in the response, put in the MDC so every log line carries
  it, and returned inside the error body. An id supplied by the caller is kept,
  so a chain of services shares one, but only if it is a short plain token:
  otherwise it is replaced, because the value goes into log lines and a response
  header, where an unchecked one lets a caller forge log entries.
- **The MDC is cleared when the request ends.** The thread returns to the pool;
  anything left behind would be attributed to the next person's request.
- **Errors are built in one place.** `ApiErrors` is the only construction site of
  `ApiError`, so a new field cannot be silently left null in four of five
  handlers, which is exactly how the request id would have gone missing.
- **Anthropic is never retried.** A repeat of a paid call that takes up to a
  minute doubles both cost and waiting, precisely when the partner is struggling.
  It has a circuit breaker instead.
- **Open Food Facts is retried only when the connection never opened.** A read
  timeout means the server answered and then went quiet; retrying that just
  multiplies the wait. Measured: three attempts on a stalled server made a search
  box take 15.6s, and listing `ResourceAccessException` as retryable still gave
  10.2s. Only `ConnectException` is retried now.
- **A model refusal is not an outage.** A refusal or an unparseable answer means
  the partner replied, so it must not count towards opening the breaker; a
  `PlanContentException` (and `MealPhotoContentException`) is ignored by the
  breaker while still answering 502 to the caller. Without the split, a handful
  of unusual prompts took plan generation down for everyone for a minute.
- **A scheduled job runs once per schedule, not once per instance.** ShedLock
  holds the lock in Postgres, so a second instance skips a job the first is
  running. With one instance it changes nothing; on the first rolling deploy it
  is the difference between one notification and two.
- **Job times are Brazil's, not the server's.** A production JVM in UTC would
  fire the 09:00 flash mission at 06:00 local and shift the reminder's idea of
  "today" into the middle of the night.

## Security findings

### Fixed

**O-1 (medium, fixed): a 401 returned the container's HTML page.** The entry
point used `sendError`, so a client that parses the standard envelope everywhere
received HTML markup exactly when the session expired, with no id to report. It
now answers in the same envelope, with `requestId`. Proved by
`CorrelationIdIT.anUnauthenticatedRequestAnswersTheStandardEnvelopeWithAnId`.

### Verified and fine

- **Metrics are off the public port.** `/actuator/prometheus` answers 404 on the
  API's port and 200 on 9090, measured against the running application. A live
  readout of the system is not exposed alongside the API.
- **`show-details: never` on health.** The detail names the database, Redis and
  which component failed, which is a map of the system for anyone probing.
- **The caller's id is validated.** Letters, digits, hyphen and underscore only,
  at most 64 characters; anything else is replaced, which closes log and header
  injection through that path.
- **No personal data in the MDC.** User and pair ids only, never a name or an
  e-mail, because a log is a file that travels.

### Open

- **The management port has no authentication of its own.** The protection is the
  network: the port stays inside the compose stack and nginx never maps it.
  Verified on the deployed staging machine, where the edge forwards only to
  `:8080` and `/actuator` answers 404.
- **Architecture cycles went from 3 to 6.** `config` imports
  `auth.infrastructure.security` (the JWT filter) while `auth` imports
  `config.JwtProperties`. The cycle already existed and became visible along more
  paths when `config` started importing `shared.web`. Moving the entry point to
  `shared.web` reduced the coupling without undoing the cycle. Undoing it means
  moving the `@ConfigurationProperties` next to their users, which is a refactor
  of its own.

## Tests: what each one protects

| Test                        | Risk it protects against                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `CorrelationIdIT` (7)       | a failure nobody can trace; a forged id in the log; context leaking between requests; HTML on a 401 |
| `ManagementEndpointsIT` (5) | metrics on the public port; metrics nowhere at all; a paid call with no counter                     |
| `CircuitBreakerIT` (3)      | a partner outage holding threads; a model refusal taking the feature down for everyone              |
| `SchedulerLockIT` (3)       | a duplicated notification per instance; a job in the wrong zone                                     |

### What is not covered

- **JSON logs under the prod profile**: the configuration exists and the profile
  starts in `SwaggerDisabledInProdIT`, but no test reads a log line and confirms
  it is valid JSON with `requestId` inside.
- **The breaker's half-open state**: the test covers closed and open, not the
  transition back after sixty seconds.
- **Two real instances competing for the lock**: the test proves the lock is
  taken and stays valid, not that a second JVM is turned away.
- **Open Food Facts metrics**: only the AI calls are counted.

## How to verify in production

```bash
# The id the user reported appears in the log
grep requestId /var/log/vitalpair/app.log | grep <reported-id>

# Circuit breaker states (1 means the breaker is in that state)
curl -s localhost:9090/actuator/prometheus | grep resilience4j_circuitbreaker_state

# AI calls by kind and outcome
curl -s localhost:9090/actuator/prometheus | grep vitalpair_ai_requests_total
```

```sql
-- Who holds the lock for each scheduled job
SELECT name, locked_by, locked_at, lock_until FROM shedlock;
```

## Prometheus and Grafana (staging)

`deploy/compose.monitoring.yaml` starts both. It publishes no port on the host:
it joins the `edge` network and reaches the application through the
`backend-staging` alias, which is the same reason port 9090 is not mapped.

```bash
docker compose -f deploy/compose.monitoring.yaml --env-file deploy/env/staging.env up -d
```

| File                                                  | What it is                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `deploy/monitoring/prometheus.yml`                    | what is scraped, every 15s                                       |
| `deploy/monitoring/grafana/provisioning/`             | datasource and provider, so a recreated machine comes back alike |
| `deploy/monitoring/grafana/dashboards/vitalpair.json` | the dashboard, versioned in git                                  |

The dashboard has three blocks: whether the application is up and answering
(requests by status, response time percentiles), the parts that talk to third
parties (breaker states, AI calls by outcome, AI p95 latency), and the machine
underneath (heap, connection pool, and an `up` panel that exists to tell a quiet
application apart from a broken scrape).

**Staging only, deliberately.** On a single machine, a scraper and a dashboard
competing for memory with the application is a worse trade than having no graphs
in production. No Loki for the same reason: with one node, `docker compose logs`
answers the same question.

Grafana refuses to start without `GRAFANA_ADMIN_PASSWORD`. A monitoring
dashboard with default credentials on the internet is how a machine gets taken,
so there is no default value.

The stack was checked against a local backend registered under the
`backend-staging` alias: Prometheus reported the target up, heap and breaker
queries returned real values, and the datasource and dashboard provisioned
themselves with nobody clicking.

## Known debt

- Port 9090 is open to anyone who reaches the network, so the edge must never map
  it. Verified on the deployed machine: the edge forwards only to `:8080`,
  `/actuator` answers 404 on both sites (`smoke.sh` checks it), and no compose
  file publishes 9090. See [deployment.md](deployment.md).
- **`vitalpair.auth.logins` does not exist.** Only `vitalpair.ai.requests` and
  `vitalpair.ai.latency` were implemented, which is why the dashboard has no
  login graph.
- `AiMetrics.timed` wraps the call in a `Supplier`, which makes it impossible to
  tell a failed call from a failure to parse the answer in the metrics.

## History

| Date       | Change                                                                                                                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-10 | Grafana reachable through the edge on staging behind basic auth (`deploy/nginx/extras/staging.conf`, users in `deploy/env/htpasswd`, `Authorization` stripped before Grafana); production answers 404 on the same path |
| 2026-09-09 | `deploy/compose.monitoring.yaml` with Prometheus and Grafana provisioned, and the dashboard versioned. Verified against the local backend, with the target scraped and queries returning real data                     |
| 2026-09-06 | Correlation id end to end, `ApiErrors` centralised, JSON entry point, business metrics and a separate management port, breakers on both external APIs with retry only where it helps, ShedLock on both jobs            |
