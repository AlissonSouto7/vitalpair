# Feature: missions

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped, with a gap that matters (see M-1)
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-06

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

| Method | Path                            | Action                                           |
| ------ | ------------------------------- | ------------------------------------------------ |
| GET    | `/api/v1/missions/flash`        | Today's mission and whether the pair accepted it |
| POST   | `/api/v1/missions/flash/accept` | Accept it, for the whole pair                    |
| GET    | `/api/v1/missions/weekly`       | The week's targets and how far each is           |

None takes a request body, so there is nothing to validate.

### Data

| Table             | Created in                        | Notes                                                                 |
| ----------------- | --------------------------------- | --------------------------------------------------------------------- |
| `missions`        | `V13__create_missions.sql`        | Global catalogue. Four `FLASH` rows seeded                            |
| `pair_missions`   | `V13`                             | `UNIQUE (tenant_id, mission_date)`. Keyed on the pair, not the person |
| `weekly_missions` | `V15__create_weekly_missions.sql` | Global catalogue. Three rows                                          |

Seeded flash missions, worth 50, 30, 40 and 35 points respectively: drink two
litres of water, log three meals, do a workout, hit eight thousand steps.

Seeded weekly missions: log meals on five days (40 points), train three times
(35), and both of you train three times (60).

## Business rules

| #   | Rule                                                                          | Why                                                                                                 |
| --- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| R-1 | The flash mission is chosen deterministically from the day of the year        | Everybody gets the same one, and no state is needed to decide it                                    |
| R-2 | Accepting is per pair, not per person                                         | The mission is a thing the two of them do; either accepting turns it on for both                    |
| R-3 | Accepting twice does nothing beyond refreshing the timestamp                  | Enforced by `UNIQUE (tenant_id, mission_date)` and by the upsert                                    |
| R-4 | Weekly progress is computed from the real logs on every request, never stored | A stored counter is a second source of truth that can disagree with the first                       |
| R-5 | A pair mission with no partner cannot be completed                            | There is nobody to do the other half                                                                |
| R-6 | The week runs Monday to today, not Monday to Sunday                           | The bar shows progress so far, not a projection                                                     |
| R-7 | Workouts exclude `STEPS`                                                      | Walking is counted by the steps mission; counting it as a workout too would make the target trivial |

## Security findings

### Open

| ID  | Severity | File                                     | What happens                                                                                                                                                                                                                                                                                                                                                                                        | Measured impact                                                                                                                                                                                                        | Why it is still open                                                                                                                                                                        |
| --- | -------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-1 | Medium   | across `mission` and `gamification`      | **Completing a mission awards no points.** `reward_points` is in the catalogue, is serialised to the client, and is read by nothing. `PointSource.MISSION` exists, is permitted by the database, has a display label on the season screen, and is written by no code. Verified by grep: the only ledger writes pass `MEAL`, `ACTIVITY` or `STREAK`, and `acceptToday` writes only the accepted flag | The whole feature is decorative. A user completing every mission for a month gains nothing, and the "Missões" row on the season breakdown is permanently empty because a row with zero on both sides is suppressed     | It is feature work, not a fix: something has to decide _when_ a flash mission counts as completed, which nothing currently tracks. Reported rather than smuggled into a documentation phase |
| M-2 | Medium   | `MissionService`                         | The accepted row stores a `missionCode`, and `getToday` ignores it, recomputing the mission from the catalogue every time. The update branch of `acceptToday` never rewrites the code either                                                                                                                                                                                                        | If the catalogue is edited, or the request crosses midnight, the pair sees mission X marked accepted while the row records mission Y                                                                                   | Reading the stored code when present is the fix, and it wants a test that this feature has nowhere to put yet                                                                               |
| M-3 | Low      | `MissionService`, `WeeklyMissionService` | Dates come from `LocalDate.now()` and `ZoneId.systemDefault()`, ignoring `vitalpair.scheduling.zone`, which exists precisely because the server's zone is not the user's. On a UTC server the flash mission rolls over at nine in the evening Brazilian time                                                                                                                                        | Every user, every day, on any deployment whose JVM is not in `America/Sao_Paulo`                                                                                                                                       | Same root cause as N-3 in [nutrition.md](nutrition.md) and AC-3 in [activity.md](activity.md). One fix, applied everywhere                                                                  |
| M-4 | Low      | `pair_missions`                          | There is no record of _which_ partner accepted                                                                                                                                                                                                                                                                                                                                                      | Not harmful; it does mean "who committed us to this" is unanswerable                                                                                                                                                   | A column, whenever the screen wants to show it                                                                                                                                              |
| M-5 | Low      | `WeeklyMissionMetricsJpaRepository`      | For a pair mission, the partner's logs are counted with no privacy predicate, and their raw progress number is returned to the caller                                                                                                                                                                                                                                                               | A private **meal** therefore contributes to a shared target, and the count is visible. The count is a number, not a description: the partner learns that something was logged, which the scoreboard already tells them | Consistent with the privacy rule in [feed.md](feed.md), where private means "what", not "whether". Recorded so the boundary is explicit rather than accidental                              |
| M-6 | Low      | `WeeklyMissionService`                   | One count query per catalogue entry, plus a second for each pair mission: four count queries per request today, growing with the catalogue                                                                                                                                                                                                                                                          | Three missions, so it is small. It grows linearly                                                                                                                                                                      | Fine at this size; a single grouped query when the catalogue grows                                                                                                                          |

### Verified and fine

| Check                               | How it was verified                                                                                                                           | Date       |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Reads are scoped                    | `pair_missions` is queried by `tenant_id` from the principal; the metric queries filter by `user_id`. The two catalogues are global by design | 2026-09-06 |
| No cross-pair read                  | `TenantIsolationIT` covers both mission endpoints                                                                                             | 2026-09-06 |
| Accepting cannot create a duplicate | `UNIQUE (tenant_id, mission_date)` plus the upsert                                                                                            | 2026-09-06 |
| The catalogues are not user data    | `missions` and `weekly_missions` hold no tenant or user column                                                                                | 2026-09-06 |

## Tests

**This feature has no tests of its own.** Thirty-six classes, three endpoints, no
test file under `src/test/java/com/aps/vitalpair/mission/`.

| Test                | Type        | Risk it covers                                                          |
| ------------------- | ----------- | ----------------------------------------------------------------------- |
| `TenantIsolationIT` | integration | That the two read endpoints answer 200 and contain no other pair's data |

### What is not covered

Everything else, specifically:

- The day-of-year rotation, including what happens at the turn of the year, when the cycle
  restarts mid-sequence because 365 is not a multiple of four.
- The empty-catalogue case, which throws.
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

-- read only: M-1, mission points never enter the ledger, so this returns nothing
SELECT count(*) FROM point_events WHERE source = 'MISSION';

-- read only: M-2, a stored code that is not today's mission
SELECT tenant_id, mission_date, mission_code FROM pair_missions WHERE mission_date = current_date;
```

## Known debt

| Item                            | Impact                                     | When it is meant to be addressed                                             |
| ------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| M-1, missions award nothing     | The feature does not do what it appears to | Needs a completion rule first; it is the largest product gap in the codebase |
| No tests at all                 | Every rule above can change silently       | After a `Clock` is injectable                                                |
| M-2, the stored code is ignored | The screen and the row can disagree        | With the tests                                                               |
| M-3, the timezone               | The day rolls over at the wrong hour       | One fix across the codebase                                                  |
| M-6, a query per mission        | Grows with the catalogue                   | When the catalogue grows                                                     |

## History

| Date       | Change                                              | Pull request             |
| ---------- | --------------------------------------------------- | ------------------------ |
| 2026-09-06 | Document created, M-1 found and reported (phase 13) | `docs/professional-docs` |
