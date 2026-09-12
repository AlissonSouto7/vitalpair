# Feature: season

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-06

## What it is and where it lives

A thirty-day competition between the two people in a pair, with a stake they agree
on ("whoever loses buys dinner"). The screen shows the day number, the days left,
both totals, a per-day chart, a breakdown by where the points came from, and the
history of previous seasons.

The number on that screen is never read from the weekly scoreboard. It is always
re-summed from `point_events`, the ledger `gamification` writes at the same moment
it updates the scoreboard. That is the design: one place records what happened, and
the season derives everything from it.

|                   |                                                    |
| ----------------- | -------------------------------------------------- |
| Frontend routes   | `/season`, `/season-end`                           |
| Who can access it | authenticated user                                 |
| Backend package   | `com.aps.vitalpair.season` (26 classes, 931 lines) |
| Feature flag      | none                                               |

## Architecture

| Layer           | Files                                                                |
| --------------- | -------------------------------------------------------------------- |
| Controller      | `season/infrastructure/web/SeasonController.java`                    |
| Use case ports  | `GetSeasonUseCase`, `RecordPointUseCase`, `UpdateStakeUseCase`       |
| Service         | `season/application/service/SeasonService.java` implements all three |
| Output ports    | `SeasonRepositoryPort`, `PointEventRepositoryPort`                   |
| Projections     | `UserPoints`, `DayUserPoints`, `SourceUserPoints`                    |
| Frontend pages  | `SeasonPage.tsx`, `SeasonEndPage.tsx`                                |
| i18n namespaces | `season`, `seasonEnd`                                                |

`RecordPointUseCase` is the published port `gamification` depends on. It is the only
way anything enters the ledger.

### Endpoints

| Method | Path                   | Action                                                       |
| ------ | ---------------------- | ------------------------------------------------------------ |
| GET    | `/api/v1/season`       | The current season with scores, chart, breakdown and history |
| PUT    | `/api/v1/season/stake` | Set the stake, at most 255 characters                        |

### Data

| Table          | Created in                     | Notes                                                                                                                                         |
| -------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `point_events` | `V16__create_point_events.sql` | The ledger. `source IN ('MEAL','ACTIVITY','STREAK','MISSION')`. No unique constraint of any kind                                              |
| `seasons`      | `V17__create_seasons.sql`      | `status IN ('ACTIVE','CLOSED')`, and a **partial unique index** `uq_seasons_active_per_tenant ON seasons (tenant_id) WHERE status = 'ACTIVE'` |

Every ledger read filters by `tenant_id` and a half-open `[start, end)` window, and
deliberately returns **both** members' rows, because the screen is a comparison. The
tenant always comes from the authenticated principal, never from a parameter.

## Business rules

| #    | Rule                                                                                                           | Why                                                                                                                                                           |
| ---- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1  | A season is 30 days, covering `[start, end)` with the end exclusive                                            | One convention, applied in the lifecycle loop and in every ledger window, so a day is never counted twice or missed                                           |
| R-2  | The lifecycle is lazy: seasons are created, closed and opened when someone opens the screen, with no scheduler | A scheduler for two people is machinery nobody needs, and a pair that stops using the app does not need its seasons rolled over on time. See S-3 for the cost |
| R-3  | The first season starts on the day the pair was created                                                        | The alternative, starting it on first view, would give an empty chart for the days already lived                                                              |
| R-4  | Rolling over is a loop, so a pair returning after months gets every intervening season closed in order         | Otherwise the numbering and the history would have holes                                                                                                      |
| R-5  | Seasons are contiguous: the next starts on the day the previous ended                                          | No dead days between competitions                                                                                                                             |
| R-6  | The stake carries over to the next season                                                                      | Re-agreeing every thirty days is friction nobody asked for                                                                                                    |
| R-7  | Points always come from the ledger, never from the weekly scoreboard                                           | The scoreboard is a snapshot per week; a season spans several. Deriving from the ledger is what makes the two agree                                           |
| R-8  | The winner is the higher total; an exact tie has no winner                                                     | There is no secondary tie-break, and inventing one would be arbitrary                                                                                         |
| R-9  | At most one `ACTIVE` season per tenant, enforced by a partial unique index                                     | The database refuses a second one rather than trusting the lifecycle to be correct                                                                            |
| R-10 | The per-day chart labels days 1..N, not dates                                                                  | The screen is about progress through the season, not the calendar                                                                                             |
| R-11 | A breakdown row with zero on both sides is suppressed                                                          | An empty row teaches the reader nothing                                                                                                                       |

## Security findings

### Open

| ID  | Severity      | File                                                    | What happens                                                                                                                                                                                                                                                                                                                                                                                                                                             | Measured impact                                                                                                                                                                                                                                                                                                                                 | Why it is still open                                                                                                                                                                                                                                                          |
| --- | ------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-1 | Medium        | `SeasonController#current`                              | A `GET` that mutates state: it creates, closes and opens season rows. Two partners opening the screen at the same moment can both try to insert the first season, and the partial unique index rejects the second, surfacing as a 500 on a plain read                                                                                                                                                                                                    | Not reproduced under test. The window is the first view of a new season, so it is narrow but real, and it is widest exactly when both people are most likely to look: the day a season rolls over                                                                                                                                               | The correct fix is to catch the constraint violation and reload. `SeasonServiceTest` now covers the lifecycle around it, so the change can be made with the surrounding behaviour pinned rather than blind; what is still missing is a test that reproduces the race itself   |
| S-2 | Medium        | `SeasonService#buildHistory`                            | Every request loads all closed seasons with no pagination and issues one aggregate query per season                                                                                                                                                                                                                                                                                                                                                      | One extra `GROUP BY` scan per closed season, on the app's main screen, forever: twelve after a year. Not measured against real data, since nothing is deployed                                                                                                                                                                                  | The persisted `winner_user_id` already holds the answer (see S-4) and is ignored. Fixing both together is the sensible order                                                                                                                                                  |
| S-3 | Low           | `SeasonService`                                         | Nothing closes a season until someone opens the app, so an abandoned pair keeps an `ACTIVE` season indefinitely and no winner is ever computed                                                                                                                                                                                                                                                                                                           | Deliberate, documented in three places in the code and the migrations                                                                                                                                                                                                                                                                           | It is the cost of R-2. It becomes worth revisiting when a season close should send a notification                                                                                                                                                                             |
| S-4 | Low           | `SeasonService`                                         | `seasons.winner_user_id` is written when a season closes and never read: the history recomputes the winner from the ledger instead. Two computations of the same fact                                                                                                                                                                                                                                                                                    | They can only disagree if a ledger row is backfilled or deleted after close, which nothing does today. The column also has no foreign key, unlike `competition_scores.winner_id`                                                                                                                                                                | Reading the stored value would fix S-2 at the same time                                                                                                                                                                                                                       |
| S-5 | Low           | `SeasonService#updateStake`                             | The caller's membership of the pair is never asserted, only that the pair is the one their `tenant_id` points at                                                                                                                                                                                                                                                                                                                                         | Unreachable today, for the same reason as P-3 in [pair.md](pair.md): `tenant_id` is only ever set by registration or by joining, both of which place the user in a slot                                                                                                                                                                         | Recorded rather than fixed                                                                                                                                                                                                                                                    |
| S-7 | Medium        | `SeasonService`, `CompetitionService`, `MissionService` | The season window, the competition week and the missions take "today" from the JVM's zone, while meals and activities are bucketed in the person's zone since #75. With the JVM in UTC, a pair formed between 21:00 and midnight in Brasília starts its season on the next UTC day, and the points logged that night are stamped at the Brasília day's midnight, before the season began: the season screen shows 0 while the weekly scoreboard shows 10 | Reproduced by CI, whose runners are UTC: four integration tests (`LeavePairIT`, `PairFormationIT`, `AccountDeletionIT`, `ConcurrentScoringIT`) failed at 02:39 and 02:5x UTC on 2026-09-11 after passing all day, with `expected: 10 but was: 0` and empty day lists. The window is three hours a night, for every pair formed or scoring in it | **Mitigated**, not solved: the backend and the test JVMs are pinned to the product's home zone (`TZ` in `compose.app.yaml`, `argLine` in `pom.xml`), so every "today" agrees for people in Brazil. The proper fix is the open product decision: whose zone is a pair's season |
| S-6 | Low           | `PointEventJpaRepository`                               | The per-day chart groups with `CAST(occurred_at AS LocalDate)`, evaluated in the database session's timezone, while rows are written at local midnight of the JVM's zone                                                                                                                                                                                                                                                                                 | The two agree when both are the same zone. A mismatch shifts chart days without shifting totals, so the chart and the total would disagree by a day                                                                                                                                                                                             | Related to the wider timezone question recorded as N-3 in [nutrition.md](nutrition.md). Worth solving once, everywhere                                                                                                                                                        |
| S-8 | Informational | `PointSource.MISSION`                                   | The value exists in the enum, is permitted by the database CHECK, has a display label, and **nothing ever writes it**. Completing a mission marks it accepted and awards no points                                                                                                                                                                                                                                                                       | Verified by grep: the only `record` call sites pass `MEAL`, `ACTIVITY` or `STREAK`, and `MissionService.acceptToday` writes only `accepted`. So `reward_points` in the mission catalogue is unused and the "Missões" row never appears                                                                                                          | A functional gap in the missions feature, not a defect here. Reported and left for a feature change rather than smuggled into a documentation phase                                                                                                                           |

### Verified and fine

| Check                                | How it was verified                                                                                                                             | Date       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| No unscoped query                    | Every ledger and season read filters by `tenant_id` taken from the principal. Read in full                                                      | 2026-09-06 |
| The stake does not leak across pairs | `TenantIsolationIT` seeds each pair's stake as `Alpha stake` / `Beta stake` and asserts neither string appears in the other's response          | 2026-09-06 |
| The ledger matches the scoreboard    | `ConcurrentScoringIT.theLedgerStillAgreesWithTheScoreboardAfterConcurrentScoring`, reading the season endpoint against the competition endpoint | 2026-09-06 |
| The stake is validated on the server | `@NotBlank @Size(max = 255)`, matching the column                                                                                               | 2026-09-06 |
| Queries are parameterised            | Three JPQL constructor projections with named parameters; no concatenation                                                                      | 2026-09-06 |

## Tests

| Test                          | Type        | Risk it covers                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TenantIsolationIT`           | integration | Cross-pair reads of the season and the stake, with distinguishable seeded values                                                                                                                                                                                                                                                                                                         |
| `SeasonServiceTest` (7 cases) | unit        | The lifecycle, reachable now that the clock is injected: the first season starting the day the pair did, a season surviving its own last day, rolling over the day it ends, a pair away for months rolling through every season it missed, the winner coming from the ledger, a scoreless season closing without one, the stake being inherited, and a point filed in the product's zone |
| `ConcurrentScoringIT`         | integration | That the season total derives correctly from the ledger and agrees with the scoreboard                                                                                                                                                                                                                                                                                                   |

```bash
./mvnw verify -Dit.test='TenantIsolationIT,ConcurrentScoringIT'
```

### What is not covered

This is the least tested feature in the codebase, and the gap is in the most
intricate logic in it. There are **no unit tests** for `SeasonService`.

- **The whole lifecycle**: creating the first season, `rollOver`, the catch-up loop, the
  numbering, the stake carrying over. No test advances the clock.
- **The `[start, end)` boundary**, so the behaviour exactly on `end_date` is unverified.
- **The tie**, R-8, and the `"TIE"` string in the history.
- **The history**, since no test ever produces a closed season.
- **The no-partner path**, where `hasPartner` is false.
- **A user with no pair**, which is a 404 on the whole screen.
- **S-1**, the concurrent first view.
- Every date decision uses `LocalDate.now(...)` directly, with no injected `Clock`, so most
  of the above cannot be tested without changing the system clock. Introducing a `Clock`
  bean is the prerequisite for closing this gap.

## How to verify in production

```sql
-- read only: the partial unique index should make this impossible
SELECT tenant_id, count(*) FROM seasons WHERE status = 'ACTIVE' GROUP BY tenant_id HAVING count(*) > 1;

-- read only: seasons should be contiguous, so this returns nothing
SELECT a.tenant_id, a.number, a.end_date, b.start_date
FROM seasons a JOIN seasons b ON b.tenant_id = a.tenant_id AND b.number = a.number + 1
WHERE b.start_date <> a.end_date;

-- read only: an ACTIVE season whose end date has passed means nobody opened the app (S-3)
SELECT count(*) FROM seasons WHERE status = 'ACTIVE' AND end_date <= current_date;

-- read only: S-7, mission points never enter the ledger
SELECT source, count(*) FROM point_events GROUP BY source;
```

## Known debt

| Item                                            | Impact                                                 | When it is meant to be addressed                                                                     |
| ----------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| No unit test for the lifecycle                  | The most intricate logic in the codebase is unverified | Needs an injected `Clock` first; that pair of changes is the highest-value work left in this feature |
| S-1, a GET that can 500 under concurrency       | A rare error on the main screen                        | With the tests above, so the fix can be proved                                                       |
| S-2 and S-4, history recomputed instead of read | Unbounded N+1 on every page load                       | One change fixes both                                                                                |
| S-6, timezone of the day bucket                 | Chart and total can disagree by a day                  | Solve with N-3, once, everywhere                                                                     |
| S-8, missions award no points                   | A whole feature has no effect on the season            | Feature work, reported not fixed                                                                     |

## History

| Date       | Change                                                                                                                                                                                                                  | Pull request           |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 2026-09-11 | The service took an injected clock in the product's zone, replacing the static `ZoneId.systemDefault()` that caused S-7, and the lifecycle got its first unit test: seven cases, reachable only because the clock moved | `fix/audit-loose-ends` |
| 2026-09-06 | Document created                                                                                                                                                                                                        | #32                    |
