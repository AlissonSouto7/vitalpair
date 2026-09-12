# Feature: automated test suite

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-12

## What it is and where it lives

The backend has two test layers. Unit tests (`*Test`) exercise a class with its
collaborators mocked and run on `mvn test`. Integration tests (`*IT`) boot the
whole application on a random port against real Postgres, Redis and SMTP in
containers, with WireMock standing in for Anthropic and Open Food Facts, and run
on `mvn verify`.

The split exists because the three most damaging bugs found in this codebase
were all invisible to unit tests: a Feign proxy that could not reach a
package-private type, a servlet filter registered twice, and a migration that
added a NOT NULL column no adapter wrote to. Each of them needs a request
crossing the real stack to show up.

The frontend suites are documented separately: component and unit tests in
[frontend-foundation.md](frontend-foundation.md), the browser suite in
[browser-tests.md](browser-tests.md).

|                   |                                                  |
| ----------------- | ------------------------------------------------ |
| Frontend route    | none                                             |
| Who can access it | developers and CI                                |
| Backend package   | `com.aps.vitalpair.support` (shared scaffolding) |
| Feature flag      | none                                             |

## Architecture

| Layer               | Files                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Build               | `pom.xml`: `maven-surefire-plugin` (`*Test`), `maven-failsafe-plugin` (`*IT`), `jacoco-maven-plugin` (shared exec file) |
| Test profile        | `src/test/resources/application-test.yaml`                                                                              |
| Containers          | `support/TestcontainersConfiguration.java` (Postgres 16, Redis 7), `support/MailpitSupport.java` (Mailpit)              |
| External APIs       | `support/WireMockSupport.java`, fixtures in `src/test/resources/wiremock/__files/`                                      |
| Integration base    | `support/AbstractIntegrationTest.java`                                                                                  |
| Slice base          | `support/ControllerSliceTest.java`                                                                                      |
| Test authentication | `support/security/WithVitalPairUser.java` + its context factory                                                         |
| Architecture rules  | `architecture/HexagonalArchitectureTest.java`, frozen violations in `src/test/resources/archunit_store/`                |

### How to run

```bash
./mvnw test                                  # unit tests only, no Docker
./mvnw verify                                # everything, including *IT
./mvnw verify -Dit.test=TenantIsolationIT    # one integration test
```

Docker must be running. The first execution pulls `postgres:16-alpine`,
`redis:7-alpine` and `axllent/mailpit:v1.31.1`.

Both JVMs, the test one and the packaged application, run in
`America/Sao_Paulo` (`argLine` in `pom.xml`, `TZ` in `deploy/compose.app.yaml`),
so a test that asks for "today" gets the same answer on a developer's machine, on
a CI runner in UTC, and on the server. See S-7 in [season.md](season.md) for what
happened before that was true.

## Business rules

The rules this scaffolding enforces.

- **The test profile layers over the real configuration, it does not replace it.**
  `application-test.yaml` used to shadow `application.yaml` entirely, so a broken
  property in the main file could pass the whole suite and only fail when the
  packaged application started.
- **Containers win over any local configuration.** A developer's `.env` is read
  by spring-dotenv during tests too; every value it could inject is overridden,
  and `SchemaValidationIT` asserts the JDBC connection is the container's.
- **A real key must never reach a test.** The Anthropic key in the test profile
  is the literal `test-api-key`, and `AnthropicPlanGenerationIT` asserts the
  stub received exactly that.
- **Integration tests share one application context.** State that leaks between
  them is reset in `AbstractIntegrationTest.isolateFromPreviousTests()`: WireMock
  stubs and the Redis rate-limit counters, since every test calls from 127.0.0.1.
- **Slice tests import the real `SecurityConfig`.** Without it a `@WebMvcTest`
  falls back to Spring Boot's stock security, which enables CSRF; every POST then
  answers 403 and the test either passes for the wrong reason or needs a CSRF
  token the real API never requires.
- **WireMock fixtures are captured responses, not inventions.** The Anthropic and
  Open Food Facts bodies under `wiremock/__files/` came from the live APIs. When
  an upstream changes shape, the fixture is what has to be re-captured.
- **A test that passes on its first run is broken on purpose once.** The
  production code is sabotaged and the test has to go red before it counts. The
  feature documents name the sabotage where it changed the test's design.

## Security findings

### Fixed

| ID  | Severity | File                                         | What happened                                                                                                                                                                                                                                                                                                       | Measured impact                                                                                                                                                                    | Fix                                                                                                                                                                                                                                                                                                                                                                            |
| --- | -------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T-1 | Critical | `V22__ai_plans_tenant_id.sql`, both adapters | The migration made `tenant_id` NOT NULL on `meal_plans` and `workout_plans` and no adapter wrote the column, so `POST /api/v1/meal-plan/generate` and `POST /api/v1/workout-plan/generate` answered 500. The reads also filtered by `user_id` alone, so the protection the migration was meant to add did not exist | Both generation endpoints broken from 2026-09-05 until the fix. Not noticed earlier because no plan had been generated after the migration (`select count(*) from meal_plans` = 0) | `tenantId` crosses the domain model, the ports, the services and the controllers; reads use `findByUserIdAndTenantIdAndWeekStart`; a meal swap uses `findByIdAndPlanId`, so another user's item id finds nothing. `AnthropicPlanGenerationIT.aGeneratedPlanIsStoredWithItsTenant` (red before, green after) and `TenantIsolationIT.theMealPlanBelongsToThePairThatGeneratedIt` |

### Verified and fine

| Check                             | How it was verified                                                                                                                                                                                                                                                                                        | Date       |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Isolation between pairs           | `TenantIsolationIT` runs 22 authenticated reads against two pairs with distinguishable data, plus cross-tenant writes: deleting another pair's food log, reacting to a foreign feed item, toggling another user's exercise, and joining an already formed pair with a code read straight from the database | 2026-09-12 |
| Refresh token rotation and replay | End to end, including revoking the whole family and clearing the cookie on logout (`AuthFlowIT`)                                                                                                                                                                                                           | 2026-09-06 |
| Account enumeration               | `forgot-password` answers identically for an existing and a nonexistent address, and no message is delivered to the second                                                                                                                                                                                 | 2026-09-06 |
| Rate limiting                     | Applied once in the chain, per IP on login and per user on plan generation, with the right envelope and `Retry-After` (`RateLimitIT`)                                                                                                                                                                      | 2026-09-06 |
| Swagger                           | Off in production, on in development (`SwaggerDisabledInProdIT`, `DevProfileIT`)                                                                                                                                                                                                                           | 2026-09-06 |
| Refresh cookie                    | `HttpOnly`, `SameSite=Strict`, `Path=/api/v1/auth`, `Secure` in production and not in development, where the session would otherwise never work over http                                                                                                                                                  | 2026-09-06 |
| External API failures             | 529, refusal, timeout, dropped connection and invalid JSON become a handled 502, never a 500, and persist no partial plan                                                                                                                                                                                  | 2026-09-06 |

### Open

- **`ai` has no unit tests.** The feature is covered end to end by integration
  tests, not by unit tests of its services. Acceptable for now: the value was in
  the real path, which is where the bugs appeared. Measured 2026-09-12:
  `src/test/java/com/aps/vitalpair/ai` holds `AnthropicPlanGenerationIT` and
  `CircuitBreakerIT` only.
- **Nine cycles between features are frozen** in the ArchUnit store, so an
  existing one does not fail the build and a new one does. Counted on
  2026-09-12 from `src/test/resources/archunit_store`. The one between `config`
  and `auth` is described in [observability.md](observability.md).

## Tests

| Test                               | Type        | Risk it covers                                                                                                                               |
| ---------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthFlowIT` (12)                  | integration | A broken browser session, a stolen token that keeps renewing, verification and reset mail not delivered, account enumeration                 |
| `TenantIsolationIT` (22 reads + 9) | integration | Data leaking between pairs on any read or write                                                                                              |
| `AnthropicPlanGenerationIT` (13)   | integration | The paid integration broken, a 500 on a partner failure, spending without a complete profile, a plan not persisted                           |
| `OpenFoodFactsSearchIT` (9)        | integration | The food search taking the screen down when the public API fails or stalls; a junk query or an unmetered caller spending an outbound call    |
| `RateLimitIT` (4)                  | integration | Brute force on login, one account running up the AI bill                                                                                     |
| `SchemaValidationIT` (3)           | integration | A missing migration, an entity out of step with the database, a test pointing at the developer's database                                    |
| `DevProfileIT` (2)                 | integration | A YAML error in the profile everybody runs, a `Secure` cookie breaking local login                                                           |
| `SwaggerDisabledInProdIT` (2)      | integration | The whole API map exposed in production                                                                                                      |
| `AdminStatsControllerTest` (3)     | slice       | `@PreAuthorize` silently ignored                                                                                                             |
| `RestExceptionHandlerTest` (5)     | slice       | A malformed body, invalid UTF-8, a wrong enum value or a wrong type becoming a 500 instead of a 400 that names the field                     |
| `HexagonalArchitectureTest`        | unit        | A new dependency pointing outwards, a controller outside `infrastructure.web`, an entity outside `persistence`, a new cycle between features |

The per-feature tests, and what each one protects, are listed in the feature
documents.

### What is not covered

- **Concurrency, beyond scoring.** `ConcurrentScoringIT` fires overlapping meal
  logs and proves a day scores once. Two people accepting one invite, two
  people leaving at the same instant, two generations of the same plan and two
  tabs refreshing one cookie are reasoned about in their feature documents and
  not tested.
- **The reminder scheduler's body.** `SchedulerLockIT` proves the lock and the
  zone; only the mission job is driven, and only for its lock. See
  [notifications.md](notifications.md).
- **Google OAuth.** `GoogleTokenVerifier` is mocked in every test; no test
  exchanges a real Google ID token.
- **The real upstream APIs.** Every test replays a captured fixture. A change in
  Anthropic's or Open Food Facts' response shape is not caught here.
- **The half-open state** of the circuit breaker. See
  [ai-plans.md](ai-plans.md).

## How to verify in production

```sql
-- read only: every plan must belong to its owner's tenant. Zero rows expected.
SELECT p.id FROM meal_plans p JOIN users u ON u.id = p.user_id
 WHERE p.tenant_id IS DISTINCT FROM u.tenant_id;

SELECT p.id FROM workout_plans p JOIN users u ON u.id = p.user_id
 WHERE p.tenant_id IS DISTINCT FROM u.tenant_id;
```

## Known debt

| Item                                                   | Impact                                                                                                                                               | When it is meant to be addressed                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Coverage is not recorded here                          | The JaCoCo floor in `pom.xml` is 88% line and 65% branch; the current figures are not measured in this document. `./mvnw verify` produces the report | Read the report rather than this table                                     |
| `TenantIsolationIT` compares bodies by id and by label | Only works while each pair has distinguishable seeded data; the first version lacked it and a sabotage passed unnoticed                              | Every new seeded fixture must carry a distinguishable value                |
| `ai` without unit tests                                | A change to prompt assembly or parsing is only caught by a slow integration test                                                                     | When the Feign client is replaced, so the rewrite has fast tests around it |

## History

| Date       | Change                                                                                                                                                                                                                      | Pull request |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 2026-09-11 | Test JVMs pinned to the product's zone                                                                                                                                                                                      | #92          |
| 2026-09-06 | Suite created: containers, WireMock with captured fixtures, Mailpit, the integration base class and 72 integration tests. `contextLoads` removed, since seven integration classes now boot the context. T-1 found and fixed | #23          |
