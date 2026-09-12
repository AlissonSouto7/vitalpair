# Architecture

How VitalPair is built and why. Written for someone arriving at the codebase who
needs the shape of it before reading any single file.

For what the product is, see the [README](../README.md). This document is about
the code.

Measured on 2026-09-06: 467 backend classes across 19 feature packages, 14,742
lines of Java, 24 migrations, 23 mapped tables, 118 frontend modules.

## The shape

```
                    ┌──────────────────────────────────┐
   browser ────────▶│ nginx (edge)  TLS, HSTS, CSP     │
                    └───────┬──────────────────┬───────┘
                            │ /api/            │ /
                            ▼                  ▼
                    ┌───────────────┐   ┌──────────────┐
                    │ Spring Boot   │   │ React SPA    │
                    │ :8080  :9090  │   │ static files │
                    └───┬───────┬───┘   └──────────────┘
                        │       │
              ┌─────────▼─┐   ┌─▼──────────┐
              │ Postgres  │   │ Redis      │
              │ data      │   │ tokens,    │
              │           │   │ rate limit │
              └───────────┘   └────────────┘

                External: Anthropic (AI), Open Food Facts (nutrition data)
```

Port 9090 carries health and metrics and is never routed by the proxy. See
[deploy/README.md](../deploy/README.md).

## Backend: hexagonal, organised by feature

Packages are named after what they do for the user, not after technical layers.
There is no `controllers` package; there is `nutrition`, and the controller lives
inside it. A feature can then be read, changed or deleted in one place.

```
nutrition/
  domain/          the rules, with no framework in sight
    model/         plain Java types
    port/in/       what the feature can do (use cases)
    port/out/      what the feature needs (repositories, external APIs)
    exception/
  application/
    service/       implements the use cases, owns the transaction
    dto/
    listener/      reacts to other features' events
  infrastructure/
    web/           REST controllers
    persistence/   JPA entities and adapters
    client/        external HTTP clients
```

Dependencies point inwards only: `infrastructure → application → domain`. The
domain imports no Spring, no JPA, no Jackson. This is not a convention anyone has
to remember: `HexagonalArchitectureTest` fails the build on a violation.

### Rules the tests enforce

| Rule                                                                        | Why it exists                                                                                                                                              |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The domain imports no framework                                             | Business rules that need a container to run are rules nobody can test cheaply                                                                              |
| The domain imports nothing from `application`                               | Frozen at 28 pre-existing cases, all of them inbound ports returning an `application.dto`. The convention predates the rule; the freeze stops it spreading |
| A feature never imports another's `infrastructure` or `application.service` | Otherwise every feature eventually depends on every other and none can be changed alone                                                                    |
| `@RestController` only in `..infrastructure.web..`                          | A controller elsewhere means the layering has quietly stopped being true                                                                                   |
| `@Entity` only in `..infrastructure.persistence..`                          | Same                                                                                                                                                       |
| No cycles between features                                                  | Frozen at six pre-existing ones; the build fails on a seventh                                                                                              |

### Cross-feature communication

Two ways, and no third.

**A published port.** The workout plan needs to log an activity, so it depends on
`activity`'s `LogActivityUseCase`: an interface in the other feature's
`domain.port.in`. It never touches that feature's service or its tables.

**A domain event**, when the originating feature should not know who cares.
Logging a meal publishes an event; gamification awards points, the feed records
an item and notifications tell the partner, none of which nutrition knows about.

Listeners run `AFTER_COMMIT` with `REQUIRES_NEW`, so a listener that fails cannot
roll back the meal the person just logged. Eleven listeners depend on that being
kept.

### Persistence

**No JPA associations.** No `@OneToMany`, no `@ManyToOne`. Aggregates are
assembled in the service layer from explicit queries. It is more code, and it
means every query a request makes is visible in the code rather than emerging
from a lazy-loading decision made three layers away.

**Every row carries `tenant_id`.** A pair is a tenant. Every query that reads
user-owned data filters by it, and `TenantIsolationIT` builds two pairs with real
data and checks that no endpoint leaks one into the other. The check exists
because this is a promise no compiler makes: phase 7 found meal plans that were
scoped by user alone, which the migration adding the column had been meant to fix.

**Migrations are immutable and expand/contract.** A migration that has run
anywhere is never edited; it is corrected by a new one. A column is added, then
written to, then backfilled, then the old one dropped in a later release, so a
deploy can be rolled back without rolling back the database.

## Authentication

An access token as a signed JWT, valid fifteen minutes, sent as a bearer header
and kept in memory by the browser only.

A refresh token that is opaque, stored in Redis, and delivered as an HttpOnly,
Secure, SameSite=Strict cookie scoped to `/api/v1/auth`. Page scripts cannot read
it, which is the point: an access token is worth fifteen minutes to an attacker,
a refresh token is worth thirty days and renews itself.

Refresh tokens are single-use and grouped into families. Every rotation issues a
new token in the same family. A spent token coming back means either theft or a
client bug, and there is no way to tell from the server, so the whole family is
revoked: one forced login beats an intruder with a month of quiet access.

Roles are `USER` and `ADMIN`, carried as a JWT claim and enforced by
`@PreAuthorize`. Promotion is a database update with no endpoint behind it,
because an API that grants admin is an escalation path.

## Observability

Every request gets an id: generated or taken from `X-Request-Id`, put in the MDC
so every log line carries it, echoed in the response, and returned inside the
error body. A person reporting a failure quotes a string that finds the exact log
line.

Production logs one JSON object per line in the Elastic Common Schema, native to
Boot. Development keeps a readable line with the id in front.

Metrics are on port 9090: JVM, HTTP, circuit breaker state, and the application's
own counters for AI calls by kind and outcome, because a paid call nobody counts
is a bill nobody predicted.

## Resilience

Both external APIs have a circuit breaker, and only one has retry.

Anthropic is never retried: repeating a paid call that takes up to a minute
doubles cost and waiting exactly when the partner is struggling. Open Food Facts
is retried, but only when the connection never opened; a read timeout means the
server answered and went quiet, and retrying that only multiplies the wait.

A model refusing to answer is not an outage. Those failures are excluded from the
breaker's accounting, because otherwise a handful of unusual prompts takes the
feature down for everyone.

Scheduled jobs hold a lock in Postgres (ShedLock), so a second instance skips a
job the first is running rather than sending every notification twice.

## Frontend

React with TypeScript, Vite, Tailwind, Zustand for session state and TanStack
Query for server state.

Every route is a dynamic import, so a visitor opening the login form downloads
that screen rather than all 27. The legal texts, which are a third of all
translations and are read by almost nobody, are their own chunk.

Interface strings are never hardcoded: they live in `src/locales/<namespace>.ts`
carrying pt, en, es and fr side by side, and a test fails if a key is missing
from any of the four.

## Testing

| Layer                | What it proves                                                                            | Count |
| -------------------- | ----------------------------------------------------------------------------------------- | ----- |
| Unit (`*Test`)       | A class behaves, collaborators mocked                                                     | 79    |
| Integration (`*IT`)  | The whole application against real Postgres, Redis, SMTP, with WireMock for external APIs | 95    |
| Browser (Playwright) | The built application, driven as a person drives it                                       | 14    |
| Frontend unit        | i18n parity, error handling                                                               | 98    |

The split is not ceremony. The three worst defects found in this codebase were
all invisible to unit tests: a Feign proxy that could not reach a package-private
type, a servlet filter registered twice, and a migration adding a NOT NULL column
no adapter wrote to. Each needed a request crossing the real stack.

## Decisions recorded elsewhere

Feature documents in [features/](features/) carry the rules, security findings
and known debt per area. [adr/](adr/) holds architecture decisions.
[deploy/README.md](../deploy/README.md) covers running it on a server.
