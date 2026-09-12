# Feature: the user's day

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-12

## What it is and where it lives

Everything the product calls "today" is a question about one person's day: the
meals on the day's list, the totals on the dashboard, the bar on the progress
chart, the streak, the weekly scoreboard. This feature decides where that day
starts and ends.

The answer is a per-user preference, stored as an IANA time zone identifier.

|                   |                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Frontend route    | `/profile` (the field), every screen that shows a day (the effect)                         |
| Who can access it | the signed-in person, for their own account only                                           |
| Backend package   | `user` (the preference), `nutrition` / `activity` / `progress` / `dashboard` (the readers) |
| Feature flag      | none                                                                                       |

## Architecture

| Layer       | Files                                                                               |
| ----------- | ----------------------------------------------------------------------------------- |
| Migration   | `V27__users_time_zone.sql`                                                          |
| Domain      | `user/domain/model/UserTimeZones.java`, `User.zone()`, `shared/time/DayWindow.java` |
| Port        | `user/domain/port/in/UserDayUseCase.java`                                           |
| Service     | `user/application/service/UserDayService.java`                                      |
| Validation  | `user/infrastructure/web/ValidTimeZone.java`                                        |
| Persistence | `user/infrastructure/persistence/UserPersistenceMapper.java` (String to ZoneId)     |
| Frontend    | `frontend/src/features/profile/TimeZoneField.tsx`                                   |

| Endpoint           | Method | What it does                                    | Who       |
| ------------------ | ------ | ----------------------------------------------- | --------- |
| `/api/v1/users/me` | GET    | returns `timeZone` with the rest of the profile | the owner |
| `/api/v1/users/me` | PUT    | accepts an optional `timeZone`                  | the owner |

Every endpoint that takes an optional `date` (`/nutrition/logs`,
`/nutrition/summary`, `/activity`, `/activity/summary`, `/dashboard`) resolves
"no date given" to today in the caller's zone.

### How to run

```bash
./mvnw verify                                  # includes DayBoundaryIT
./mvnw failsafe:integration-test -Dit.test=DayBoundaryIT
npm --prefix frontend test                     # TimeZoneField
```

## Business rules

- **The day belongs to the user, not the server.** The server's zone is an
  accident of where it runs. Nothing in the code asks what time it is "here".
- **An IANA identifier, not an offset.** An offset does not know about daylight
  saving, and Brazil has had it before and may have it again.
- **A half-open window**: the start is included, the end is not. A closed end
  would need 23:59:59.999999999, which either loses the last fraction of a second
  or counts it twice, depending on the column's precision.
- **Absent means "leave it alone".** `timeZone` is the only optional field in the
  profile form: a client that does not know about it cannot clear someone's
  preference as a side effect of saving their weight.
- **The browser's suggestion is never applied on its own.** Someone travelling
  for a week must not have their day boundary moved silently: the app offers and
  the person decides.
- **The day is derived, never stored.** Changing the zone changes which day
  already-logged meals belong to. The instant is the fact and the day is a
  reading of it.
- **An unknown zone on read falls back to the default and is logged.**
  Identifiers are retired from time to time, and a JDK update is enough to orphan
  one. Failing there would make the account unreadable, taking down login and
  every screen, because of a preference.

## Security findings

### Fixed

**D-1 (high, fixed): the meal vanished from the day's list.** The controller
asked `LocalDate.now()` in the JVM's zone while the adapter turned that date into
a window fixed in UTC. The two ends agreed only when the two zones did.

Measured at UTC-3 with the browser test: the meal saved with a `201` and the
reloaded list came back empty.

```
POST 201 /api/v1/nutrition/logs {"foodName":"Arroz com feijao","caloriesKcal":260,...}
GET  200 /api/v1/nutrition/logs {"data":[]}
```

From 21:00 to midnight, every day, in Brazilian time, a logged meal disappeared
from the list immediately: three hours a day, at dinner time.

In production the JVM runs in UTC and the two ends agree again, so the symptom
disappears and the error changes shape. The "day" becomes the UTC day, and
someone eating at 21:00 has the meal counted on the following day, with nothing
on screen to show it.

**D-2 (medium, fixed): the same pairing in three other features.** `activity`,
`progress` and `dashboard` had exactly the same combination. Found by grepping
for `LocalDate.now()` without a zone and for `ZoneOffset.UTC`, once D-1 had shown
the pattern.

**D-3 (medium, fixed): the scoring event carried the wrong day.**
`MealLoggedEvent` and `ActivityLoggedEvent` derived the date with
`atZone(ZoneOffset.UTC)`. That date is the key for the streak, the missions and
the weekly scoreboard, so a meal at 21:00 scored on the next day and could break
a streak the person had not broken.

**D-4 (low, fixed): the progress chart grouped in the database's zone.** The
per-day grouping happened inside SQL with `CAST(loggedAt AS LocalDate)`, which
uses the database session's zone. It is now `AT TIME ZONE :zone`, with the zone
bound as a parameter.

### Verified and fine

- **The zone is validated on the server**, with `ZoneId.of` through
  `@ValidTimeZone`, not with a regex or a fixed list: what matters is whether the
  server can resolve the name. An invented zone answers 400.
- **The `:zone` parameter of the native query is bound, not interpolated**, so it
  carries no SQL. Tested with `Mars/Olympus_Mons`, which is refused before it
  reaches the database.
- **Owner scoping is kept**: `findByUserAndDay` still takes an explicit `userId`.
  The window carries no owner, and changing the signature to the window alone
  would have dropped the filter.
- **Nobody reads another person's zone**: `UserDayUseCase` is only ever called
  with the authenticated caller's own id, and `TenantIsolationIT` (30 tests) stays
  green.
- **The preference is not sensitive data**: a zone does not identify anyone on its
  own, and it only reaches the log when it is invalid, in which case the rejected
  value is the problem itself.

### Open

- **The zone is not in the JWT**, so every endpoint that resolves "today" reads
  the user. Where the service already loaded the user (nutrition, progress) it
  costs nothing; where it did not (activity, dashboard) it is one extra query per
  request. Putting it in the token brings the opposite problem: the value would be
  stale for up to fifteen minutes after someone changed it.

## Tests: what each one protects

| Test                                   | Risk it protects against                                                                                                                                                                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DayBoundaryIT` (9)                    | an evening meal vanishing from the list; the day's total disagreeing with the list; two people in different zones; changing zone; no date given; an invalid zone; an absent zone clearing the preference; a new account with no zone; a chart bar on the wrong day |
| `UserProfileServiceTest` (+2)          | saving the weight changing the zone by accident                                                                                                                                                                                                                    |
| `TimeZoneField.test.tsx` (3)           | the notice not appearing; the notice applied on its own; a browser that does not report a zone                                                                                                                                                                     |
| `nutrition.spec.ts` (1)                | the whole path in a browser: log a meal and see it in the list                                                                                                                                                                                                     |
| `TenantIsolationIT` (30, pre-existing) | the new native query leaking another pair's data                                                                                                                                                                                                                   |

With the original bug reintroduced (`DayWindow.of(date, ZoneOffset.UTC)` and
`LocalDate.now()` in the controller), `DayBoundaryIT` fails 5 of 8; with the fix,
9 of 9 pass. The chart test was checked separately by pinning `"UTC"` in the
query, which fails that test alone.

### What is not covered

- **Daylight saving**: `DayWindow.of` uses `atStartOfDay(zone)`, which already
  handles the day on which midnight does not exist, but no test exercises such a
  date. Brazil has no daylight saving today, so the risk belongs to people in
  other countries.
- **An orphaned zone on read**: the `catch` that falls back to the default has no
  test, because forging an identifier the JDK used to know and no longer does
  would mean altering the JVM's time zone database.
- **Streaks and missions**: D-3 fixed the date the event carries, but the streak
  tests still use fixed dates and do not exercise the boundary.

## How to verify in production

```sql
-- zone distribution, to know whether the default still serves
SELECT time_zone, count(*) FROM users WHERE deleted_at IS NULL GROUP BY 1 ORDER BY 2 DESC;

-- meals in the three hours that used to vanish, in the logger's own zone
SELECT u.email, f.logged_at, (f.logged_at AT TIME ZONE u.time_zone)::date AS day
FROM food_logs f JOIN users u ON u.id = f.user_id
WHERE (f.logged_at AT TIME ZONE u.time_zone)::time >= '21:00'
ORDER BY f.logged_at DESC LIMIT 20;
```

## Known debt

- **There is no full zone picker**, only the current value and the browser's
  suggestion. Anyone wanting a zone other than their device's cannot choose it
  from the screen.
- **The partner's zone is not considered in anything shared.** `SeasonService:48`,
  `WeeklyMissionService:52` and `MissionService:96` use `ZoneId.systemDefault()`.
  On 2026-09-11 this stopped being theoretical: with the JVM in UTC (the CI
  runner), four integration tests failed between 21:00 and midnight in Brasilia,
  because the season started "tomorrow" and the evening's points fell before it.
  Recorded as S-7 in `season.md`. The backend JVM and the test JVM now run in the
  product's home zone (`America/Sao_Paulo`), which resolves it for anyone in
  Brazil and leaves the product question open: with both people in Brazil it makes
  no difference, and with an international pair one person's week is not the
  other's. Deciding whose week a pair's week is belongs to the product, not to
  the code. Note that `systemDefault()` is the server's zone, UTC in production,
  so these are the same three places that need a decision before there is a user
  outside Brazil.

## History

| Date       | Change                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-09 | Per-user time zone: `V27`, `UserDayUseCase`, `DayWindow`, the profile field. D-1 to D-4 fixed with red-to-green proof, found by the meal-logging browser test |
