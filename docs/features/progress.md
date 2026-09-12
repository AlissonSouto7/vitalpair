# Feature: progress

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-08

## What it is and where it lives

The screen that answers "am I getting anywhere": a weight line over the last
twenty-six recorded points, a seven-day calorie bar chart against the target, and
the week's average macros against theirs.

Weight is personal, not shared. `weight_logs` is the only user table in the
codebase with no `tenant_id`, and that is deliberate.

|                   |                                                      |
| ----------------- | ---------------------------------------------------- |
| Frontend route    | `/progress`                                          |
| Who can access it | authenticated user, their own data only              |
| Backend package   | `com.aps.vitalpair.progress` (19 classes, 591 lines) |
| Feature flag      | none                                                 |

## Architecture

| Layer          | Files                                                       |
| -------------- | ----------------------------------------------------------- |
| Controller     | `progress/infrastructure/web/ProgressController.java`       |
| Use case ports | `GetProgressUseCase`, `RecordWeightUseCase`                 |
| Service        | `progress/application/service/ProgressService.java`         |
| Output ports   | `WeightLogRepositoryPort`, `NutritionMetricsRepositoryPort` |
| Frontend page  | `ProgressPage.tsx`                                          |
| i18n namespace | `progress`                                                  |

`RecordWeightUseCase` is a published port: `user` calls it when the profile
weight changes, so the history gains a point without either feature importing
the other's service.

### Endpoints

| Method | Path                      | Action                                                                 |
| ------ | ------------------------- | ---------------------------------------------------------------------- |
| GET    | `/api/v1/progress`        | Weight history, the seven-day calorie chart, the week's macro averages |
| POST   | `/api/v1/progress/weight` | Record today's weight, replacing today's entry if there is one         |

### Data

| Table         | Created in                    | Notes                                                                                                      |
| ------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `weight_logs` | `V18__create_weight_logs.sql` | `UNIQUE (user_id, recorded_on)`, index on `(user_id, recorded_on)`. **No `tenant_id`**: weight is personal |

The calorie chart reads `food_logs`, which belongs to `nutrition`, through a
dedicated read-only repository rather than through that feature's service. The
alternative would be a dependency from progress on nutrition's application layer,
which the architecture forbids.

## Business rules

| #   | Rule                                                                            | Why                                                                                                               |
| --- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| R-1 | One weight per person per day; recording again replaces it                      | Enforced by the unique constraint and by a read-then-write. A day with two weights has no meaningful line to draw |
| R-2 | Weight can only be recorded for today                                           | There is no date on the request. It keeps the endpoint honest at the cost of P-4                                  |
| R-3 | The history returns the twenty-six most recent points, oldest first             | Twenty-six is half a year of weekly weighing, which is the longest span the chart reads well at                   |
| R-4 | With no history but a profile weight, one synthetic point is returned for today | An empty chart on the first visit looks broken. One point looks like a beginning                                  |
| R-5 | The window is seven days ending today, with missing days filled as zero         | The chart must have seven bars whether or not there are seven days of data                                        |
| R-6 | An incomplete profile does not break the screen: targets come back null         | Unlike `/users/me/tdee`, which refuses. This is a chart, and a chart without a goal line is still a chart         |

## Security findings

### Open

| ID  | Severity      | File                                     | What happens                                                                                                                                                                                             | Measured impact                                                                                                                                                                                              | Why it is still open                                                                                                          |
| --- | ------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| P-1 | Low           | `ProgressService#avg`                    | The macro average divides by seven regardless of how many days have data. Someone who logged two days of perfect eating sees roughly two sevenths of what they ate, plotted against a full daily target  | Every user who does not log every day, which is most of them. Documented in the code as intentional, and it is still the wrong denominator: the label says "average", and this is a total spread over a week | It is a product decision about what the number means. Changing it silently would move everyone's chart                        |
| P-2 | Low           | `ProgressService#buildCalorieDays`       | A day with nothing logged is filled with zero calories and marked `withinGoal = true`, because zero is under any target                                                                                  | A user who never opens the app has a perfect green week. There is no flag telling the client the difference between "ate nothing" and "logged nothing"                                                       | Needs a `hasData` field on the response and a client change                                                                   |
| P-3 | Low           | `NutritionMetricsPersistenceAdapter`     | The seven-day window is built in UTC while the day boundaries come from the server's zone                                                                                                                | At UTC−3, a dinner logged after nine in the evening falls in the next bar                                                                                                                                    | Same root cause as N-3 in [nutrition.md](nutrition.md)                                                                        |
| P-4 | Low           | `RecordWeightRequest`, `ProgressService` | Weight accepts anything positive up to 999.99 and can only ever be today. There is no `@DecimalMin`, so 0.01 kg is valid, and no correction path for a mistyped weight from a previous day, nor a delete | A typo is permanent and distorts the chart until it scrolls off. The profile path caps weight at 500 kg, so the two write paths into the same column disagree by a factor of two                             | Bounding it is easy; the correction path is a product decision                                                                |
| P-5 | Informational | `ProgressService`                        | The macro labels are Portuguese strings built on the server (`"Proteína"`, `"Carboidrato"`, `"Gordura"`), so this part of the response is not translatable                                               | Any non-Portuguese client shows Portuguese labels on that chart                                                                                                                                              | The same class of problem as the Portuguese exception messages: it wants a code the frontend translates. Backlogged with them |

### Verified and fine

| Check                                                  | How it was verified                                                                                                                     | Date       |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Every read is scoped to the caller                     | `findRecentByUser`, `findByUserIdAndRecordedOn` and `findDailyTotals` all filter by `user_id` taken from the principal                  | 2026-09-06 |
| Weight is not shared with the partner                  | `weight_logs` has no `tenant_id`, no endpoint returns another user's weight, and `PartnerSummary` carries no weight field               | 2026-09-06 |
| No cross-pair read                                     | `TenantIsolationIT` covers the progress endpoint                                                                                        | 2026-09-06 |
| The upsert cannot create two rows for one day          | `UNIQUE (user_id, recorded_on)` backs the read-then-write                                                                               | 2026-09-06 |
| Reading nutrition's table does not couple the features | The read goes through a repository owned by progress, not through nutrition's service. `HexagonalArchitectureTest` would fail otherwise | 2026-09-06 |

## Tests

| Test                            | Type | Risk it covers                                                                                                                                                                                                                                                                                                           |
| ------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ProgressServiceTest` (9 cases) | unit | The averages dividing by the window rather than by the days with records; the seven-day span ending today; a blank day reading as zero; `withinGoal` at exactly the target; no target meaning every day is within it; the profile weight standing in until the first weigh-in; a weigh-in filed in the person's own zone |

Each one was proved non-vacuous: dividing by the logged days, using the
server's date, and making the goal comparison strict each fail exactly the test
that covers them.

| Test                | Type        | Risk it covers                                                     |
| ------------------- | ----------- | ------------------------------------------------------------------ |
| `TenantIsolationIT` | integration | That `/api/v1/progress` answers 200 and leaks no other pair's data |

### What is not covered

- The seven-day window and its zero fill, R-5.
- P-1, the fixed divisor.
- P-2, the null-target degradation.
- The weekday initial lookup, which indexes an array by day-of-week: an off-by-one would
  mislabel every chart and nothing would notice.
- The descending fetch and reversal that produces chronological order.
- Both branches of the upsert.
- R-4, the synthetic point from the profile weight.

## How to verify in production

```sql
-- read only: R-1, two weights for one person on one day would mean the constraint was lost
SELECT user_id, recorded_on, count(*) FROM weight_logs GROUP BY 1,2 HAVING count(*) > 1;

-- read only: P-4, weights outside anything plausible
SELECT count(*) FROM weight_logs WHERE weight_kg < 20 OR weight_kg > 500;

-- read only: how many people actually have a history worth charting
SELECT count(*) FROM (SELECT user_id FROM weight_logs GROUP BY 1 HAVING count(*) > 1) t;
```

## Known debt

| Item                                     | Impact                                                    | When it is meant to be addressed                                                                                                                                                                                                                  |
| ---------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-1, the divisor                         | The average understates intake for anyone who skips a day | Product decision                                                                                                                                                                                                                                  |
| P-2, an unlogged day reads as success    | Flattering and wrong                                      | Needs a response field                                                                                                                                                                                                                            |
| P-4, unbounded and uncorrectable weights | A typo is permanent                                       | Half done: the browser refuses anything outside 20 to 500 kg since the form rewrite. `RecordWeightRequest` still accepts up to 999.99, so a direct API call can log 3 kg; tighten it to the profile's bound with a test. Correction still missing |
| P-5, Portuguese labels from the server   | Untranslatable                                            | With the error-code work                                                                                                                                                                                                                          |

## History

| Date       | Change                                                                                                                                                                                                                                                                                          | Pull request                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 2026-09-11 | The feature got its first tests: nine cases over the chart arithmetic and the day boundary, each proved non-vacuous by breaking the service on purpose                                                                                                                                          | `fix/audit-loose-ends`              |
| 2026-09-06 | Document created                                                                                                                                                                                                                                                                                | #32                                 |
| 2026-09-08 | the weight form became one component, `WeightForm`, shared with the profile screen. It refuses an empty weight, zero and anything outside 20 to 500 kg with a message, and shows the server's message when a save fails (the profile copy had no `catch`). First 5 component tests. P-4 updated | `refactor/frontend-forms-and-tests` |
