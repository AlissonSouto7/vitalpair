# Feature: activity

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-08

## What it is and where it lives

The other half of the daily balance: steps, runs, rides and workouts, with the
calories they burned. Logging one publishes an event, which is what feeds the
scoreboard, the feed and the partner's notification.

|                   |                                                      |
| ----------------- | ---------------------------------------------------- |
| Frontend route    | `/activity`                                          |
| Who can access it | authenticated user, their own logs only              |
| Backend package   | `com.aps.vitalpair.activity` (19 classes, 532 lines) |
| Feature flag      | none                                                 |

## Architecture

| Layer          | Files                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| Controller     | `activity/infrastructure/web/ActivityController.java`                                       |
| Use case ports | `LogActivityUseCase`, `GetActivitiesUseCase`, `GetActivitySummaryUseCase`                   |
| Service        | `activity/application/service/ActivityService.java`                                         |
| Output port    | `ActivityLogRepositoryPort`                                                                 |
| Persistence    | `ActivityLogJpaEntity`, `ActivityLogJpaRepository`, `ActivityLogPersistenceAdapter`, mapper |
| Frontend page  | `ActivityPage.tsx`                                                                          |
| i18n namespace | `activity`                                                                                  |

`GetActivitySummaryUseCase` is a published port: `dashboard` depends on it to
build the daily balance, without touching this feature's service or its table.

### Endpoints

| Method | Path                             | Action                                                |
| ------ | -------------------------------- | ----------------------------------------------------- |
| POST   | `/api/v1/activity/logs`          | Log an activity. 201, publishes `ActivityLoggedEvent` |
| GET    | `/api/v1/activity/logs?date=`    | The day's activities                                  |
| GET    | `/api/v1/activity/summary?date=` | Calories burned, steps and a count for the day        |

### Data

| Table           | Created in                     | Notes                                                                                                                                                                                                                                                      |
| --------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `activity_logs` | `V3__create_activity_logs.sql` | `activity_type IN ('STEPS','RUN','WALK','CYCLE','WORKOUT','OTHER')`, `source IN ('WEWARD','GOOGLE_FIT','APPLE_HEALTH','STRAVA','GARMIN','MANUAL')`. `calories_burned NUMERIC(7,2) NOT NULL DEFAULT 0`. Indexes on `(tenant_id)` and `(user_id, logged_at)` |

## Business rules

| #   | Rule                                                                                                  | Why                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| R-1 | `tenantId` is read from the stored user, never from the request                                       | A tenant a client can send is a tenant a client can change                                                      |
| R-2 | Calories are taken from the request when given; otherwise estimated as `steps × 0.04`; otherwise zero | An explicit number from a watch beats an estimate, and the column is `NOT NULL` so there must always be a value |
| R-3 | `loggedAt` defaults to now                                                                            | Most activities are logged after the fact                                                                       |
| R-4 | The summary rounds calories half-up to a whole number                                                 | Nobody reads "336.47 kcal burned"                                                                               |
| R-5 | Logging publishes `ActivityLoggedEvent` `AFTER_COMMIT` with `REQUIRES_NEW` listeners                  | Gamification, the feed and notifications react. None of them may roll back the activity                         |

## Security findings

### Open

| ID   | Severity | File                                  | What happens                                                                                                                                                                                                                                                                                               | Measured impact                                                                                                     | Why it is still open                                                                                                        |
| ---- | -------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| AC-1 | Medium   | `LogActivityRequest`, `activity_logs` | `external_id` is accepted, stored, and read by nothing. There is no unique index on `(user_id, source, external_id)` and no query uses it. A wearable integration re-syncing the same activity writes it twice, which double-counts calories, double-awards points and sends the partner two notifications | No integration exists yet, so no duplicate has occurred. The column is dead weight that looks like a guarantee      | The idempotency key it implies should exist before the first integration ships. Recorded so it is not discovered afterwards |
| AC-3 | Low      | `ActivityLogPersistenceAdapter`       | The day window is built in UTC while the schedulers use `America/Sao_Paulo` and the missions use the JVM default. Three different answers to "which day is it"                                                                                                                                             | For a user at UTC−3, an activity logged after 21:00 falls into the next UTC day and disappears from today's summary | Same root cause as N-3 in [nutrition.md](nutrition.md). Worth one fix across the codebase, not four local ones              |
| AC-4 | Low      | `ActivityService`                     | The event carries `caloriesBurned.intValue()`, which truncates, while the summary rounds half-up. The feed can show one calorie less than the summary for the same activity                                                                                                                                | One kcal. Real, invisible                                                                                           | Trivial to fix; batched with the above                                                                                      |

### Verified and fine

| Check                                               | How it was verified                                                                                                                                                                                                 | Date       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Reads are scoped to the caller                      | `findByUserAndDate` filters by `user_id`, taken from the principal; `TenantIsolationIT` covers both read endpoints                                                                                                  | 2026-09-06 |
| Input is validated server-side                      | `@NotNull` on type and source, `@PositiveOrZero` on every number, `@Size(max = 255)` on `externalId`; the database repeats the enum constraints as CHECKs                                                           | 2026-09-06 |
| A listener failure cannot lose the activity         | `AFTER_COMMIT` + `REQUIRES_NEW` on all three consumers                                                                                                                                                              | 2026-09-06 |
| An unknown enum value is a 400 that names the field | `RestExceptionHandlerTest.aWrongEnumValueNamesTheFieldAndItsAcceptedValues`, added after sending `WALKING` instead of `WALK` cost a round of guesswork                                                              | 2026-09-06 |
| A future date cannot be logged (was AC-2)           | `@NotInFuture` on `loggedAt` refuses a future instant with a 2-minute skew tolerance; a past date still logs. `BackdatedScoringIT.anActivityLoggedInTheFutureIsRefused` and `anHonestBackdatedEntryIsStillAccepted` | 2026-09-11 |

## Tests

| Test                                                            | Type        | Risk it covers                                                                    |
| --------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------- |
| `ActivityServiceTest.logActivityEstimaCaloriasAPartirDosPassos` | unit        | R-1 and R-2: the 0.04 kcal/step constant, and that the tenant comes from the user |
| `ActivityServiceTest.logActivityUsaCaloriasInformadas`          | unit        | An explicit value is not overwritten by the estimate                              |
| `ActivityServiceTest.getSummarySomaCaloriasEPassos`             | unit        | R-4, the aggregation                                                              |
| `TenantIsolationIT`                                             | integration | Cross-pair reads on both endpoints                                                |

```bash
./mvnw test -Dtest=ActivityServiceTest
```

### What is not covered

- **The controller** has no test: the date defaulting, the 201, and every validation
  annotation on `LogActivityRequest` are unexercised.
- **Event publication** is mocked and never verified, so a change that stopped publishing
  would break gamification, feed and notifications with no test turning red.
- **AC-3**, the UTC day boundary.
- **The `WEWARD` and other wearable sources** exist in the enum and no test or code path
  reaches them.

## How to verify in production

```sql
-- read only: activities by source over the last week
SELECT source, count(*) FROM activity_logs WHERE logged_at > now() - interval '7 days' GROUP BY source;

-- read only: AC-1 becoming real, once an integration exists
SELECT user_id, source, external_id, count(*) FROM activity_logs
WHERE external_id IS NOT NULL GROUP BY 1,2,3 HAVING count(*) > 1;

-- read only: a log whose tenant does not match its user would break R-1
SELECT count(*) FROM activity_logs a JOIN users u ON u.id = a.user_id WHERE a.tenant_id <> u.tenant_id;
```

## Known debt

| Item                     | Impact                                            | When it is meant to be addressed      |
| ------------------------ | ------------------------------------------------- | ------------------------------------- |
| AC-1, no idempotency key | Duplicate activities the day an integration ships | Before the first wearable integration |
| AC-3, the timezone split | Evening activities land on the wrong day          | One fix across the codebase           |
| AC-2 and AC-4            | Unbounded dates, one truncated kcal               | With AC-3                             |
| No controller test       | Validation is unexercised                         | Next change here                      |

## History

| Date       | Change                                                                                                                                                                                                                                                                                            | Pull request                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 2026-09-06 | Document created                                                                                                                                                                                                                                                                                  | #32                                 |
| 2026-09-08 | both forms on react-hook-form + zod. An empty workout and a zero step count are refused in the browser with a message; `NaN` no longer reaches the request body. First 7 component tests. Server-side, `LogActivityRequest` still accepts every measure null (open, see `frontend-foundation.md`) | `refactor/frontend-forms-and-tests` |
