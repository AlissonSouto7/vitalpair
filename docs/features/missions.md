# Feature: missions

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-10-13

## What it is and where it lives

Two kinds of challenge. A **flash mission** is one small thing for today, the
same for everybody, that the pair accepts together. A **weekly mission** is a
target measured from what was actually logged, with no accept step: three
workouts this week, five days with a meal recorded, or the same thing but only
counting if both partners do it.

Weekly progress is never stored. It is counted from `food_logs` and
`activity_logs` on every request, so it cannot drift from reality.

|                   |                                                           |
| ----------------- | --------------------------------------------------------- |
| Frontend route    | `/missions`, plus the flash card on `/dashboard`          |
| Who can access it | authenticated user; the flash mission belongs to the pair |
| Backend package   | `com.aps.vitalpair.mission` (36 classes, 1,010 lines)     |
| Feature flag      | none                                                      |

## Architecture

| Layer          | Files                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Controller     | `mission/infrastructure/web/MissionController.java`                                                                                     |
| Services       | `MissionService` (flash), `WeeklyMissionService`                                                                                        |
| Output ports   | `MissionCatalogRepositoryPort`, `PairMissionRepositoryPort`, `WeeklyMissionCatalogRepositoryPort`, `WeeklyMissionMetricsRepositoryPort` |
| Frontend page  | `MissionsPage.tsx`                                                                                                                      |
| i18n namespace | `missions`                                                                                                                              |

### Endpoints

| Method | Path                              | Action                                           |
| ------ | --------------------------------- | ------------------------------------------------ |
| GET    | `/api/v1/missions/flash`          | Today's mission and whether the pair accepted it |
| POST   | `/api/v1/missions/flash/accept`   | Accept it, for the whole pair                    |
| POST   | `/api/v1/missions/flash/cancel`   | Give it back, for the whole pair                 |
| POST   | `/api/v1/missions/flash/complete` | Declare it done, for the caller, and pay         |
| GET    | `/api/v1/missions/weekly`         | The week's targets, how far each is, and the pay |

None takes a request body, so there is nothing to validate.

`accepted` is the pair's: either member accepting turns it on for both, because
taking the dare together is the point. `done` is the caller's: each person drinks
their own water, and each is paid separately.

### Data

| Table             | Created in                        | Notes                                                                                                            |
| ----------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `missions`        | `V13__create_missions.sql`        | Global catalogue. Four `FLASH` rows seeded                                                                       |
| `pair_missions`   | `V13`                             | `UNIQUE (tenant_id, mission_date)`. Keyed on the pair, not the person                                            |
| `weekly_missions` | `V15__create_weekly_missions.sql` | Global catalogue. Three rows                                                                                     |
| `mission_rewards` | `V32__create_mission_rewards.sql` | What has already been paid. `UNIQUE (user_id, mission_code, period_start)` is what makes paying twice impossible |

Seeded flash missions, worth 50, 30, 40 and 35 points respectively: drink two
litres of water, log three meals, do a workout, hit eight thousand steps.

Seeded weekly missions: log meals on five days (40 points), train three times
(35), and both of you train three times (60).

## Business rules

| #    | Rule                                                                                               | Why                                                                                                                                                                                                                                                        |
| ---- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1  | The flash mission is chosen deterministically from the day of the year                             | Everybody gets the same one, and no state is needed to decide it                                                                                                                                                                                           |
| R-2  | Accepting is per pair, not per person                                                              | The mission is a thing the two of them do; either accepting turns it on for both                                                                                                                                                                           |
| R-3  | Accepting twice does nothing beyond refreshing the timestamp                                       | Enforced by `UNIQUE (tenant_id, mission_date)` and by the upsert                                                                                                                                                                                           |
| R-4  | Weekly progress is computed from the real logs on every request, never stored                      | A stored counter is a second source of truth that can disagree with the first                                                                                                                                                                              |
| R-5  | A pair mission with no partner cannot be completed                                                 | There is nobody to do the other half                                                                                                                                                                                                                       |
| R-6  | The week runs Monday to today, not Monday to Sunday                                                | The bar shows progress so far, not a projection                                                                                                                                                                                                            |
| R-7  | Workouts exclude `STEPS`                                                                           | Walking is counted by the steps mission; counting it as a workout too would make the target trivial                                                                                                                                                        |
| R-8  | A completed mission pays its catalogue reward once, into the week's scoreboard and the ledger      | The card promised points in green and nothing granted them. Both writes, at the same point, because the scoreboard is the week's number and the ledger is the history the season sums from: writing one without the other is how the two start disagreeing |
| R-9  | Paying twice is prevented by `UNIQUE (user_id, mission_code, period_start)`, not by checking first | Weekly progress is recounted on every read, so opening the screen ten times tries to pay ten times. Between a check and a write there is a window, and the dashboard and the missions screen read almost together, which is exactly that window            |
| R-10 | A flash mission is declared done by the person, and only then paid                                 | The app cannot tell how much water somebody drank. Paying for merely accepting would pay for tapping a button in the morning, and the scoreboard would become a count of taps                                                                              |
| R-11 | The reward is a person's, not the pair's; the acceptance is the pair's                             | Two people in one pair complete the same weekly mission on different days, and each earns their own                                                                                                                                                        |

## Security findings

### Fixed

| ID  | Severity | File                                | What happened                                                                                                                                                                                                                                                                                        | Measured impact                                                                                                                                                                                                                                                                         | Fix                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-1 | Medium   | across `mission` and `gamification` | **Completing a mission awarded no points.** `reward_points` was in the catalogue, was serialised to the client and shown in green on the screen, and was read by nothing. `PointSource.MISSION` existed, was permitted by the database, had a label on the season screen, and was written by no code | Measured against the running server on 2026-09-28: accepting the 50-point mission left the score at 25, and the "Missões" row of the season breakdown never appeared, because a row with zero on both sides is suppressed. Somebody completing every mission for a month gained nothing | A weekly mission pays when its own count reaches the target, on the read that notices it. A flash mission needs `POST /missions/flash/complete`, because the app cannot measure how much water somebody drank and paying for merely accepting would pay for a tap. Paid once by the `UNIQUE (user_id, mission_code, period_start)` of `mission_rewards` (V32), not by the code remembering to check |

### Open

| ID  | Severity | File                                     | What happens                                                                                                                                                                                                                                                 | Measured impact                                                                                                                                                                                                        | Why it is still open                                                                                                                                           |
| --- | -------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-2 | Medium   | `MissionService`                         | The accepted row stores a `missionCode`, and `getToday` ignores it, recomputing the mission from the catalogue every time. The update branch of `acceptToday` never rewrites the code either                                                                 | If the catalogue is edited, or the request crosses midnight, the pair sees mission X marked accepted while the row records mission Y                                                                                   | Reading the stored code when present is the fix, and it wants a test that this feature has nowhere to put yet                                                  |
| M-3 | Low      | `MissionService`, `WeeklyMissionService` | Dates come from `LocalDate.now()` and `ZoneId.systemDefault()`, ignoring `vitalpair.scheduling.zone`, which exists precisely because the server's zone is not the user's. On a UTC server the flash mission rolls over at nine in the evening Brazilian time | Every user, every day, on any deployment whose JVM is not in `America/Sao_Paulo`                                                                                                                                       | Same root cause as N-3 in [nutrition.md](nutrition.md) and AC-3 in [activity.md](activity.md). One fix, applied everywhere                                     |
| M-4 | Low      | `pair_missions`                          | There is no record of _which_ partner accepted                                                                                                                                                                                                               | Not harmful; it does mean "who committed us to this" is unanswerable                                                                                                                                                   | A column, whenever the screen wants to show it                                                                                                                 |
| M-5 | Low      | `WeeklyMissionMetricsJpaRepository`      | For a pair mission, the partner's logs are counted with no privacy predicate, and their raw progress number is returned to the caller                                                                                                                        | A private **meal** therefore contributes to a shared target, and the count is visible. The count is a number, not a description: the partner learns that something was logged, which the scoreboard already tells them | Consistent with the privacy rule in [feed.md](feed.md), where private means "what", not "whether". Recorded so the boundary is explicit rather than accidental |
| M-6 | Low      | `WeeklyMissionService`                   | One count query per catalogue entry, plus a second for each pair mission: four count queries per request today, growing with the catalogue                                                                                                                   | Three missions, so it is small. It grows linearly                                                                                                                                                                      | Fine at this size; a single grouped query when the catalogue grows                                                                                             |

### Verified and fine

| Check                               | How it was verified                                                                                                                           | Date       |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Reads are scoped                    | `pair_missions` is queried by `tenant_id` from the principal; the metric queries filter by `user_id`. The two catalogues are global by design | 2026-09-06 |
| No cross-pair read                  | `TenantIsolationIT` covers both mission endpoints                                                                                             | 2026-09-06 |
| Accepting cannot create a duplicate | `UNIQUE (tenant_id, mission_date)` plus the upsert                                                                                            | 2026-09-06 |
| The catalogues are not user data    | `missions` and `weekly_missions` hold no tenant or user column                                                                                | 2026-09-06 |

## Tests

| Test                                 | Type | Risk it covers                                                                                                                                                                                                                                      |
| ------------------------------------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MissionServiceTest` (7 cases)       | unit | The rotation being zero-based on day of year, and wrapping; both halves of a pair seeing the same mission with no row written; expiry at 23:59:59 in the product's zone; accepting once and twice; an empty catalogue being a 404 rather than `% 0` |
| `WeeklyMissionServiceTest` (7 cases) | unit | The week running Monday to the end of today, and Monday counting as its own first day; a PAIR mission needing both halves at the target; nobody to pair with never completing one; a SELF mission not consulting the partner                        |

Proved non-vacuous by four sabotages: dropping the `- 1` from the rotation,
expiring in UTC, completing a pair mission on the caller alone, and starting
the week on the previous Monday.

| Test                                 | Type        | Risk it covers                                                                                                                                                                                                                                                                                                          |
| ------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TenantIsolationIT`                  | integration | That the two read endpoints answer 200 and contain no other pair's data                                                                                                                                                                                                                                                 |
| `MissionRewardServiceTest` (5 cases) | unit        | R-8 to R-11: both writes at the same point, the second call paying nothing, the mission and period being recorded (without them there is no way to ask "did I already pay this?"), the points landing on the day it was earned, and a reward of zero writing nothing                                                    |
| `MissionRewardIT` (6 cases)          | integration | The same rules against a real database, which is where the uniqueness lives: accepting pays nothing, marking it done pays exactly what the card promised, twice pays once, six at once pay once, declaring it done without accepting is refused, and a weekly mission pays when it completes and not on the reads after |

### What is not covered

The rotation, the expiry and the Monday boundary are covered by the fourteen unit
cases listed above, which the `Clock` injection of 2026-09-11 made reachable. What
is left:

- **The turn of the year**, when the day-of-year cycle restarts mid-sequence because 365 is
  not a multiple of four.
- **The empty-catalogue case**, which throws.
- **Six simultaneous completions prove the outcome, not the mechanism.** Measured on
  2026-09-28: replacing the unique key with a check-then-write kept the test green, because
  the transactions serialise anyway. What it proves is that six taps do not become six
  rewards; the guarantee against the window is the key itself, which no ordering can defeat.
- **A flash mission marked done is never un-done.** There is no undo, so somebody who taps
  it by mistake keeps the points.
- The accept upsert, both branches.
- The Monday boundary of the weekly window.
- All three completion rules, including R-5.
- M-2, the stored code being ignored.

The lack of a `Clock` is the obstacle: every date decision calls `LocalDate.now()`
directly, so none of the above can be tested without changing the system clock.
Injecting a `Clock` is the prerequisite, and it is the same prerequisite the
season feature has.

## How to verify in production

```sql
-- read only: acceptance rate over the last fortnight
SELECT mission_date, count(*) FILTER (WHERE accepted) AS accepted, count(*) AS rows
FROM pair_missions WHERE mission_date > current_date - 14 GROUP BY 1 ORDER BY 1 DESC;

-- read only: what the missions have paid. Zero rows for a pair that never completed one;
-- rows with source MISSION once they do
SELECT count(*) FROM point_events WHERE source = 'MISSION';

-- read only: M-2, a stored code that is not today's mission
SELECT tenant_id, mission_date, mission_code FROM pair_missions WHERE mission_date = current_date;
```

## Known debt

| Item | Impact | When it is meant to be addressed |
| ---- | ------ | -------------------------------- |

| M-2, the stored code is ignored | The screen and the row can disagree | With the tests |
| M-3, the timezone | The day rolls over at the wrong hour | One fix across the codebase |
| M-6, a query per mission | Grows with the catalogue | When the catalogue grows |

## History

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Pull request           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 2026-10-13 | M-1 closed: a completed mission now pays what its card promises. Measured before the fix against the running server, accepting the 50-point mission left the score at 25 and the "Missões" row of the season breakdown never appeared. A weekly mission pays when its count reaches the target; a flash one needs the person to declare it done, because the app cannot measure how much water somebody drank and paying for accepting would pay for a tap. Paid once by a unique key rather than by remembering to check | pending                |
| 2026-09-11 | Both services took an injected clock, replacing `LocalDate.now()` with no zone at all, and got their first tests: fourteen cases over the rotation, the expiry, the Monday boundary and the both-halves rule                                                                                                                                                                                                                                                                                                              | `fix/audit-loose-ends` |
| 2026-09-06 | Document created, M-1 found and reported                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | #32                    |
