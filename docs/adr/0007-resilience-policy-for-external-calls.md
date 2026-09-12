# ADR 0007: Circuit-break both external APIs, retry only Open Food Facts, and never count a model refusal as an outage

- **Status**: Accepted
- **Date**: 2026-09-05
- **Deciders**: Alisson Souto
- **Supersedes**: nothing
- **Superseded by**: nothing

## Context

The application calls two external services. Anthropic generates meal and
workout plans and analyses meal photos: each call is paid, and a plan takes
around twenty seconds and up to a minute. Open Food Facts answers food searches
and barcode lookups: free, unauthenticated, and occasionally slow.

A struggling partner used to made every request wait out the full
timeout, and a burst of failures had no effect on subsequent calls. The
question was what to retry, what to short-circuit, and what counts as a
failure.

## Decision

Both integrations sit behind a **resilience4j circuit breaker**. `anthropic`:
sliding window of 10 calls, minimum 5, opens at 50% failure, stays open 60
seconds, then lets 2 calls through. `openfoodfacts`: window 20, minimum 10,
opens at 60%, open for 30 seconds.

**Anthropic is never retried.** Repeating a paid call that takes up to a minute
doubles the cost and the wait at exactly the moment the partner is struggling.
An open breaker answers 502 immediately with a message saying to try again in a
few minutes.

**Open Food Facts is retried at most once, only on `java.net.ConnectException`.**
A connection that never opened is cheap to try again and often succeeds; a read
timeout means the server answered and went quiet, and retrying that only
multiplies the wait. This was measured: retrying on any `ResourceAccessException`
took a stalled search from under 8 seconds to 15.6, and a first narrowing still
left it at 10.2, because the read timeout arrives wrapped in the same exception
type as a refused connection.

**A model refusal or an unparseable answer is not an outage.** `PlanContentException`
and `MealPhotoContentException` are listed in the breaker's `ignore-exceptions`:
they mean the partner answered and the answer is unusable, which says nothing
about its health. Without this, five unusual prompts opened the breaker and
disabled generation for every user for a minute. It was predicted, then
confirmed by a test, then fixed.

The two Anthropic paths (plans, photos) share one breaker, because they are one
partner: if it is down, each feature discovering that separately by waiting out
its own timeout helps nobody.

## Alternatives considered

### Option A: retry Anthropic once on 5xx

Rejected. A 529 (overloaded) is the case where a retry hurts most: it adds load
to a partner already refusing it, and bills the caller twice if the second
attempt succeeds after the first timed out server-side.

### Option B: no circuit breaker, timeouts only

Rejected. A timeout bounds one request; it does nothing for the next hundred.
With a breaker open, the fiftieth user during an outage waits zero seconds
instead of sixty.

### Option C: separate breakers for plans and photos

Deferred. Defensible, since the two have different timeouts and token budgets,
but they fail for the same reason today. It is a configuration change if the
failure modes ever diverge; recorded as A-9 in `docs/features/ai-plans.md`.

### Option D: a bulkhead limiting concurrent AI calls

Not adopted. The per-user rate limits (5 generations an hour, 20 photos) bound
concurrency more meaningfully than a thread pool would, and there is one
instance.

## Consequences

### What this makes easier

An outage at either partner degrades one feature quickly and visibly instead of
slowing the whole application. The breaker state is a metric on port 9090, so
"is Anthropic down" is a query, not a guess.

### What this makes harder

The half-open state is not tested. The breaker's counters live in memory, so a
restart forgets an outage and the first requests after it pay the timeout again.

### What has to change

`resilience4j-spring-boot3` and, explicitly pinned, `resilience4j-spring6` at
the same version, because the transitive one was older and lacked a class the
starter needed (the context failed to start). `@CircuitBreaker` on
`PlanAiGateway` and `AnthropicMealPhotoAnalyzer`; `@Retry` and
`@CircuitBreaker` on `OpenFoodFactsHttpClient`; the content exceptions split
out from the generation exceptions.

## Verification

- `CircuitBreakerIT`: five failures open the breaker and the sixth call never
  reaches WireMock; five refusals leave it closed.
- `OpenFoodFactsSearchIT.aStalledUpstreamGivesUpOnTheReadTimeout`: a stalled
  upstream answers in under 8 seconds.
- `curl -s localhost:9090/actuator/prometheus | grep circuitbreaker_state`.

## References

- `docs/features/observability.md`, `docs/features/ai-plans.md`,
  `docs/features/nutrition.md`
- `src/main/resources/application.yaml`, `resilience4j` block, whose comments
  carry the measured numbers.
