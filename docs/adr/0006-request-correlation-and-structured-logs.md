# ADR 0006: Correlate every request with an id and log structured JSON in production

- **Status**: Accepted
- **Date**: 2026-09-05
- **Deciders**: Alisson Souto
- **Supersedes**: nothing
- **Superseded by**: nothing

## Context

Before phase 8 a failure produced a log line with a timestamp and a message,
and the person hitting the error saw "Erro interno inesperado". Matching one to
the other meant guessing by time. Nine log statements passed only
`ex.getMessage()` and dropped the stack trace, which is how the Feign proxy
failure in phase 0 took hours to diagnose.

There is one service and one instance today. Distributed tracing would be
machinery for a topology that does not exist yet, but the property it provides,
"find the exact log line for the exact failed request", is needed now.

## Decision

Every request carries an id. `CorrelationIdFilter` runs first in the chain,
reads `X-Request-Id` from the caller if present and valid
(`[A-Za-z0-9_-]{1,64}`), generates a UUID otherwise, puts it in the MDC under
`requestId`, echoes it in the response header, and clears the MDC in `finally`.
The JWT filter adds `userId` and `tenantId` to the MDC once authenticated.

`ApiError.requestId` is filled from the MDC by the single construction site,
`ApiErrors`, so every error body carries the id that finds its log lines.

In the `prod` profile logs are one JSON object per line in the Elastic Common
Schema, using Spring Boot's native structured logging
(`logging.structured.format.console=ecs`), with the MDC fields included. In
development the log stays a human-readable line with the id in front.

Checkstyle forbids logging `ex.getMessage()` without the exception, so a stack
trace cannot be dropped again.

## Alternatives considered

### Option A: Micrometer Tracing with OpenTelemetry

Rejected for now. It gives the same correlation plus spans across services, at
the cost of a collector, an exporter and a backend to look at traces in. With
one service, a span is a log line with extra steps. It is the upgrade when a
second service exists, and the `X-Request-Id` header is compatible with it.

### Option B: Logstash JSON encoder (logstash-logback-encoder)

Rejected. It does the same as Boot's native structured logging with one more
dependency to keep patched.

### Option C: trust the caller's `X-Request-Id` unconditionally

Rejected. The value is written into every log line; an unvalidated value lets a
caller write newlines or fake fields into the log. The regex is the cheapest
possible defence.

## Consequences

### What this makes easier

A person reports the id from the error message; `grep <id>` in the log finds
every line of that request. Log lines are parseable by any collector without a
custom pattern. Metrics and logs share the same request id when both mention
one.

### What this makes harder

Development logs are slightly noisier. A test that inspects log output has to
account for the JSON shape in the prod profile; `DevProfileIT` and
`SwaggerDisabledInProdIT` cover both profiles starting.

### What has to change

`shared/web/CorrelationIdFilter`, `RequestContext`, `ApiErrors`;
`application-prod.yaml` logging block; the nine log statements rewritten to
pass the exception; a Checkstyle regex rule.

## Verification

- `CorrelationIdIT` (7 cases): the id is generated, echoed, validated, and
  present in the error body.
- `curl -H 'X-Request-Id: abc' localhost:8081/api/v1/users/me` returns the same
  id in the header and, unauthenticated, in `data.requestId`.
- Checkstyle fails on `log.warn("...", ex.getMessage())` with no exception
  argument.

## References

- `docs/features/observability.md`
- Spring Boot structured logging documentation.
