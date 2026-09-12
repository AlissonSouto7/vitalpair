# Feature: gamification

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-06

## What it is and where it lives

The points, the streaks, the badges and the weekly scoreboard. Nothing here is
triggered by a request: the feature listens for meals, activities and pair
formation, and reacts. That is why the endpoints are all reads.

|                   |                                                            |
| ----------------- | ---------------------------------------------------------- |
| Frontend route    | `/gamification`, plus the scoreboard on `/dashboard`       |
| Who can access it | authenticated user                                         |
| Backend package   | `com.aps.vitalpair.gamification` (41 classes, 1,188 lines) |
| Feature flag      | none                                                       |

## Architecture

| Layer          | Files                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Controller     | `gamification/infrastructure/web/GamificationController.java`                                                  |
| Listener       | `gamification/application/listener/GamificationEventListener.java`                                             |
| Services       | `StreakService`, `CompetitionService`, `BadgeService`                                                          |
| Output ports   | `UserStreakRepositoryPort`, `CompetitionScoreRepositoryPort`, `BadgeRepositoryPort`, `UserBadgeRepositoryPort` |
| Depends on     | `season`'s `RecordPointUseCase`, `notification`'s `CreateNotificationUseCase`, `pair`'s `PairRepositoryPort`   |
| Frontend page  | `GamificationPage.tsx`                                                                                         |
| i18n namespace | `gamification`                                                                                                 |

### Endpoints

All reads, all authenticated.

| Method | Path                                  | Action                              |
| ------ | ------------------------------------- | ----------------------------------- |
| GET    | `/api/v1/gamification/streaks`        | The caller's streaks, one per type  |
| GET    | `/api/v1/gamification/competition`    | This week's scoreboard for the pair |
| GET    | `/api/v1/gamification/badges`         | Badges the caller has earned        |
| GET    | `/api/v1/gamification/badges/catalog` | Every badge that exists             |

### Events

Consumed, all `@TransactionalEventListener(AFTER_COMMIT)` with `REQUIRES_NEW`:

| Event                 | Published by | Effect                                                |
| --------------------- | ------------ | ----------------------------------------------------- |
| `MealLoggedEvent`     | `nutrition`  | `FIRST_MEAL` badge, streak `NUTRITION_LOG`, 10 points |
| `ActivityLoggedEvent` | `activity`   | `FIRST_ACTIVITY` badge, streak `ACTIVITY`, 15 points  |
| `PairFormedEvent`     | `pair`       | `PAIR_FORMED` badge for both members                  |

Nothing is published back. The feature's only outbound effects are a notification
and a ledger write.

### Data

| Table                | Created in                    | Notes                                                                                    |
| -------------------- | ----------------------------- | ---------------------------------------------------------------------------------------- |
| `user_streaks`       | `V4__create_gamification.sql` | `UNIQUE (user_id, type)`, `type IN ('NUTRITION_LOG','ACTIVITY')`                         |
| `competition_scores` | `V4`                          | `UNIQUE (tenant_id, week_start)`, `winner_id` FK to `users`                              |
| `badges`             | `V6__create_badges.sql`       | Global catalogue, five seeded rows                                                       |
| `user_badges`        | `V6`                          | `UNIQUE (user_id, badge_id)`, which is what makes awarding idempotent                    |
| badge text           | `V12__rebrand_badge_text.sql` | A separate migration because V6 had already run and an applied migration is never edited |

## Business rules

| #    | Rule                                                                                          | Why                                                                                                                                                                                          |
| ---- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1  | A meal is 10 points, an activity 15                                                           | Activity is harder to do than to log                                                                                                                                                         |
| R-2  | Only the **first** record of a type per day scores                                            | Otherwise logging breakfast ten times farms points. This is the only defence against that, and it lives in `StreakService.registerActivity` returning empty when the day has already counted |
| R-3  | A backdated record never scores                                                               | Same guard, same line: `!date.isAfter(last)` covers both today and any earlier date                                                                                                          |
| R-4  | A streak continues only on the immediately following day; any larger gap resets it to 1       | That is what a streak means                                                                                                                                                                  |
| R-5  | The longest streak never decreases                                                            | It is a personal record, not a current state                                                                                                                                                 |
| R-6  | Every seventh consecutive day is worth 50 extra points                                        | It is a modulo, not a threshold, so it fires at 7, 14, 21 and onward                                                                                                                         |
| R-7  | Badges are idempotent: awarding one already held does nothing                                 | Enforced twice, in the service and by `UNIQUE (user_id, badge_id)`                                                                                                                           |
| R-8  | An unknown badge code is a no-op, not an exception                                            | A typo in a code must not fail the listener and lose the whole award                                                                                                                         |
| R-9  | The week runs Monday to Sunday                                                                | `TemporalAdjusters.previousOrSame(MONDAY)`, matching the season and the plans                                                                                                                |
| R-10 | A tie has no weekly winner: `winner_id` stays null                                            | There is no tie-break, and inventing one would be arbitrary                                                                                                                                  |
| R-11 | The scoreboard and the ledger are written at the same point, in the same order                | The season screen never reads the scoreboard; it re-sums `point_events`. The two must agree, which is only true if they are written together                                                 |
| R-12 | The overtake notification fires on the transition only, and goes to the person who was passed | Notifying on every point would be noise; notifying the person who moved ahead would be pointless                                                                                             |
| R-13 | A listener failure never rolls back the meal or activity that triggered it                    | `AFTER_COMMIT` with `REQUIRES_NEW`. Losing points is bad; losing the meal the person logged is worse                                                                                         |

## Security findings

### Open

| ID  | Severity      | File                                                             | What happens                                                                                                                                                                                           | Measured impact                                                                                                                                                                                                                                                                                                           | Why it is still open                                                                                                                                                                                                                  |
| --- | ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G-1 | Medium        | `CompetitionService#addPoints`, `StreakService#registerActivity` | Both are read-modify-write with no lock and no `@Version`; there is no optimistic locking anywhere in the codebase. In theory two concurrent awards can lose a write, or both pass the once-a-day gate | **Measured and not reproduced.** `ConcurrentScoringIT` fires six meal logs released together by a barrier, asserts the requests really overlapped, and finds exactly 10 points and a ledger that still matches the scoreboard. So the race is real in the code shape and does not materialise under the conditions tested | It is not currently a defect anyone can observe, and the honest fix (an atomic `UPDATE ... SET score = score + ?`, or a unique key on the ledger) is a change to the scoring core. Recorded with the evidence rather than fixed blind |
| G-2 | Low           | `V4`, `V16`                                                      | `points` is a plain `INT` with no `CHECK (points > 0)`, and `addPoints` has no floor                                                                                                                   | Nothing passes a negative today, verified by reading every call site                                                                                                                                                                                                                                                      | A penalty feature or a bug could drive a score negative, and `winnerByLedger` starts from `Long.MIN_VALUE` so it would still crown someone                                                                                            |
| G-3 | Low           | `point_events`                                                   | No unique constraint of any kind, so the ledger has no idempotency key                                                                                                                                 | Any redelivery or duplicate award inflates the season total permanently and undetectably                                                                                                                                                                                                                                  | A natural key on `(tenant_id, user_id, source, occurred_at)` would make `record` idempotent at no cost, given one award per user, source and day. Worth doing                                                                         |
| G-4 | Low           | `BadgeCategory`                                                  | The `WEIGHT` category exists in the enum and in the database CHECK, and no badge is ever seeded or awarded with it                                                                                     | Dead value. Weight logging exists and grants no badge                                                                                                                                                                                                                                                                     | Product gap rather than a defect                                                                                                                                                                                                      |
| G-5 | Informational | `CompetitionResponse`                                            | Returns `user1Score`, `user2Score` and a raw `winnerId`, so the client must fetch the pair separately to know which slot it is                                                                         | Not a leak: both users share the tenant and `/api/v1/pair` already exposes those ids                                                                                                                                                                                                                                      | Inconsistent with `SeasonResponse`, which resolves you-versus-rival server side. Worth aligning                                                                                                                                       |

### Verified and fine

| Check                                              | How it was verified                                                                                                                                                                                                                                                                       | Date       |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Points cannot be farmed by logging repeatedly      | `StreakServiceTest.naoContaDuasVezesNoMesmoDia` (unit) and `ConcurrentScoringIT.severalMealsLoggedAtOnceScoreOnlyOnce` (six overlapping requests, exactly 10 points)                                                                                                                      | 2026-09-06 |
| The ledger agrees with the scoreboard              | `ConcurrentScoringIT.theLedgerStillAgreesWithTheScoreboardAfterConcurrentScoring`                                                                                                                                                                                                         | 2026-09-06 |
| Awarding a badge twice does nothing                | `BadgeServiceTest.awardNaoDuplicaQuandoJaTem` verifies `save` is never called                                                                                                                                                                                                             | 2026-09-06 |
| A listener failure cannot roll back the meal       | Every handler is `AFTER_COMMIT` + `REQUIRES_NEW`; read and confirmed                                                                                                                                                                                                                      | 2026-09-06 |
| No cross-tenant read                               | `TenantIsolationIT` covers all four endpoints via the controller's base path                                                                                                                                                                                                              | 2026-09-06 |
| Reads are scoped                                   | Streak and badge queries filter by `user_id`, which is strictly narrower than `tenant_id`; the scoreboard filters by `tenant_id` taken from the principal, never from the request                                                                                                         | 2026-09-06 |
| A future date cannot fabricate a streak or a score | Was G-6: `loggedAt` had no upper bound, and a burst of future-dated logs built a seven-day streak, its bonus and a winning score in seconds. `@NotInFuture` on both log DTOs now refuses it; `BackdatedScoringIT` proves the exploit scores zero and an honest backdated entry still logs | 2026-09-11 |

## Tests

| Test                                       | Type        | Risk it covers                                                                                                                                                                                                                                                         |
| ------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `StreakServiceTest` (4 cases)              | unit        | Creation, consecutive increment, reset on a gap keeping the record, and R-2                                                                                                                                                                                            |
| `BadgeServiceTest` (4 cases)               | unit        | Award, R-7, R-8, and the catalogue join                                                                                                                                                                                                                                |
| `GamificationEventListenerTest` (12 cases) | unit        | The whole points economy: ten for a meal and fifteen for an activity on both the scoreboard and the ledger; the second record of a day scoring nothing; the streak bonus every seventh day and not on day six; the overtake notification firing on the transition only |
| `CompetitionServiceTest` (2 cases)         | unit        | Creating the week's row with a winner, and accumulation flipping the lead                                                                                                                                                                                              |
| `ConcurrentScoringIT` (2 cases)            | integration | G-1, with a barrier and an assertion that the requests actually overlapped                                                                                                                                                                                             |
| `TenantIsolationIT`                        | integration | Cross-pair reads                                                                                                                                                                                                                                                       |

```bash
./mvnw test -Dtest='StreakServiceTest,BadgeServiceTest,CompetitionServiceTest'
./mvnw verify -Dit.test=ConcurrentScoringIT
```

### What is not covered

- **`GamificationEventListener` has no unit test.** Every constant that defines the point
  economy, the milestone modulo, the ledger mirroring and the overtake predicate lives in
  an untested class. Changing `MEAL_POINTS` to 100 breaks no test. `ConcurrentScoringIT`
  exercises it end to end and pins the 10-point award, which is the only coverage it has.
- **The tie case**, R-10, has no test.
- **The milestone bonus**, R-6, is not tested: no test builds a seven-day streak.
- **`CompetitionService.currentScoreOf` and `partnerOf`** have no tests.
- **`getCurrentCompetition`** is untested; its user lookup is mocked and never stubbed.
- **The badge catalogue endpoint** escapes the tenant isolation sweep, which matches on the
  controller's base path rather than per route. Benign here, since the catalogue is global
  and holds no user data.

## How to verify in production

```sql
-- read only: the invariant R-11 promises, per tenant and week
SELECT c.tenant_id, c.week_start, c.user1_score + c.user2_score AS scoreboard,
       (SELECT coalesce(sum(p.points), 0) FROM point_events p
        WHERE p.tenant_id = c.tenant_id
          AND p.occurred_at >= c.week_start
          AND p.occurred_at < c.week_start + 7) AS ledger
FROM competition_scores c
ORDER BY c.week_start DESC LIMIT 20;

-- read only: a streak longer than its record would break R-5
SELECT count(*) FROM user_streaks WHERE current_count > longest_count;

-- read only: negative points would be G-2 becoming real
SELECT count(*) FROM point_events WHERE points < 0;
```

## Known debt

| Item                                                      | Impact                                           | When it is meant to be addressed                 |
| --------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| The listener that owns the point economy has no unit test | Any constant can change silently                 | Highest-value test to write next in this feature |
| G-1, scoring is not lock-protected                        | Not observed in practice, real in the code shape | With G-3, as one change to the scoring core      |
| G-3, no idempotency key on the ledger                     | A duplicate would be permanent and undetectable  | Same change                                      |
| G-2, points can be negative                               | Latent                                           | With the above                                   |
| G-4, dead `WEIGHT` badge category                         | Weight logging grants nothing                    | Product backlog                                  |
| G-5, the scoreboard response is slot-based                | The client has to correlate                      | Align with `SeasonResponse`                      |

## History

| Date       | Change                                                                                                                                                                  | Pull request               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 2026-09-11 | Future-dated logs refused (`@NotInFuture`), closing the streak/score exploit; `BackdatedScoringIT` added                                                                | `fix/security-findings-v2` |
| 2026-09-11 | The event listener got the test this document called the highest-value one left to write: twelve cases over the whole points economy, including the overtake transition | `fix/audit-loose-ends`     |
| 2026-09-06 | `ConcurrentScoringIT` added, document created (phase 13)                                                                                                                | `docs/professional-docs`   |
