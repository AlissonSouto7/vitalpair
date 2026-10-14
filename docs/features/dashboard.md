# Feature: dashboard

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-10-13

## What it is and where it lives

The home screen. The backend feature is one request that answers what you ate,
what you burned, where that leaves you against your target, and the same three
numbers for your partner, instead of the screen making six.

The screen shows more than that request. In order: how far along the goal is,
with the level and the streak beside it; the season scoreboard; the day's
calories and macros; three counters; the flash mission; and a preview of the
pair's feed. Those come from eleven queries in all, of which two are required
and nine are enrichment: a failure in any of the nine leaves the screen usable.

The backend feature owns no data. It reads three other features through their
published ports and does arithmetic.

|                   |                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Frontend route    | `/dashboard`                                                                                                                     |
| Frontend reads    | `dashboard`, `pair`, `gamification` (scoreboard, streaks, level), `activity`, `feed`, `mission`, `season`, `profile`, `progress` |
| Who can access it | authenticated user                                                                                                               |
| Backend package   | `com.aps.vitalpair.dashboard` (9 classes, 275 lines)                                                                             |
| Feature flag      | none                                                                                                                             |

## Architecture

| Layer          | Files                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| Controller     | `dashboard/infrastructure/web/DashboardController.java`                                                            |
| Service        | `dashboard/application/service/DashboardService.java`                                                              |
| Depends on     | `nutrition`'s `GetDailySummaryUseCase`, `activity`'s `GetActivitySummaryUseCase`, `pair`'s `GetCurrentPairUseCase` |
| Persistence    | none                                                                                                               |
| Frontend page  | `frontend/src/features/dashboard/DashboardPage.tsx`, `queries.ts`                                                  |
| i18n namespace | `dashboard`                                                                                                        |

The frontend does **not** mirror this into one call. `DashboardPage` issues eight
independent queries through TanStack Query, so the cheap ones paint immediately
and an optional one failing leaves the screen usable. Only the daily summary and
the pair are required to render at all.

### Endpoints

| Method | Path                      | Action                                                                |
| ------ | ------------------------- | --------------------------------------------------------------------- |
| GET    | `/api/v1/dashboard?date=` | The day's balance for the caller, and the partner's when there is one |

### The arithmetic

```
net       = consumedCalories − burnedCalories
remaining = calorieTarget − net        (null when there is no target)
```

This is **not** the same `remaining` as `GET /api/v1/nutrition/summary`, which is
`target − consumed` and ignores exercise. Two endpoints, two meanings, same word.
See D-3.

## Business rules

| #   | Rule                                                                                                         | Why                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1 | The partner block is null while the pair is pending                                                          | A solo user has a working dashboard, not an error                                                                                                                                                                                                                                                                                                                      |
| R-2 | The partner is resolved from the caller's own pair, never from a parameter                                   | It is the only thing that makes reading another user's totals legitimate                                                                                                                                                                                                                                                                                               |
| R-3 | The partner block carries name, avatar and four numbers, and nothing else                                    | No e-mail, no weight, no macro breakdown, no meal list. The membership check earns the right to a summary, not to everything                                                                                                                                                                                                                                           |
| R-4 | An incomplete profile returns null targets rather than an error                                              | This is the first screen a new account sees                                                                                                                                                                                                                                                                                                                            |
| R-5 | `date` defaults to today                                                                                     |                                                                                                                                                                                                                                                                                                                                                                        |
| R-6 | The goal bar measures from the furthest weight from the target, between the first weighing and the profile's | Saving the profile records a weighing for the day and only one fits per day, so somebody who enters 62 at onboarding and weighs 60.5 the same afternoon has a one-point series. Measured in the browser: the card read "60,5 → 58,0" with an empty bar after the person had already lost 1.5 kg. Taking the furthest covers both cases without inventing a third field |
| R-7 | Weight moving away from the target shows zero, not negative progress                                         | Somebody who gained 1.5 kg while trying to lose did not walk 1.5 kg of the way. The bar shows progress, and the setback is already in the weight above it: filling the bar would be the product congratulating the opposite of what was asked                                                                                                                          |
| R-8 | Somebody with no target weight is offered one rather than shown an empty card                                | Whoever does not know a target can be set will never go looking for where. Except for "maintain" and "improve fitness", where a target weight means nothing and asking would be a question never posed                                                                                                                                                                 |

## Security findings

### Fixed

| ID  | Severity | File                                           | What happened                                                                                                                                                                                                                                                     | Measured impact                                                                                                   | Fix                                                                                                                                                                                                                         |
| --- | -------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1 | Low      | `frontend DashboardPage.tsx`                   | The season card derived its day number from the **competition week**, so a 30-day season rendered as "TEMPORADA 01 · DIA 7 / 7" with "faltam 0 dias", on day one. The API had the right answer all along: `GET /api/v1/season` returned `day 1 / 30, daysLeft 30` | Every user, every day, on the app's main screen. Seen in the browser and confirmed against the API before the fix | The dashboard reads the season endpoint. Verified in the browser: the same card now reads "SEASON 01 · DAY 1 / 30" and "30 days left"                                                                                       |
| D-2 | Low      | `frontend Scoreboard.tsx`, `DashboardPage.tsx` | Four strings were hardcoded Portuguese in a component, and the date was formatted with a hardcoded `pt-BR`, so an English session read "Domingo · 6 de setembro" above "You're ahead". The plural was wrong too: "1 days in a row"                                | Every non-Portuguese user of the home screen                                                                      | The strings moved into the `dashboard` bundle in all four languages, the date uses the active locale through `Intl`, and the streak label uses i18next pluralisation. `npm test` covers key parity across pt, en, es and fr |

### Open

| ID  | Severity | File                                     | What happens                                                                                                                                                                                                                                       | Measured impact                                                                                                  | Why it is still open                                                                                                                                                                                                                                                                                                                                                                             |
| --- | -------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D-3 | Low      | `DashboardService` vs `NutritionService` | "Remaining calories" means `target − (consumed − burned)` here and `target − consumed` there                                                                                                                                                       | A client showing both sees two different numbers for the same day. The dashboard's is the one on the home screen | Both are defensible; what is wrong is the shared name. Renaming one is a contract change                                                                                                                                                                                                                                                                                                         |
| D-4 | Low      | `DashboardController`                    | `date` has no bound, so a request can ask for any day, past or future                                                                                                                                                                              | A future date returns zeros. Nothing leaks, nothing breaks                                                       | Worth a `@PastOrPresent`; small                                                                                                                                                                                                                                                                                                                                                                  |
| D-5 | Low      | across most features                     | The rule "domain depends on nothing outward" was not enforced, and an inbound port whose return type is an `application.dto` breaks it. Adding the ArchUnit rule found **28** such references, not one: it has been the convention since the start | Nothing at runtime; the layering is looser than the ADR claims                                                   | `dashboard`'s three DTOs moved into `domain/model`, which is what `progress` already did, and `domain_does_not_depend_on_application` was added and **frozen at 28** so the debt is recorded rather than hidden and the 29th fails the build. Verified by adding a probe violation, which the build caught. Unfreezing the rest is a refactor across most features and is not documentation work |

### Usability, found while rebuilding the screen on 2026-10-13

| ID  | Severity | File                       | What happened                                                                                             | Measured impact                                                                                                                                                                 | Fix                                                                                                       |
| --- | -------- | -------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| D-6 | Medium   | `parts.tsx`, `FeedPreview` | The feed preview read `item.title`, the legacy column, which is null on every item written since V29      | Measured against the running server: four freshly logged meals appeared with no name at all, while the API returned "Arroz branco cozido" and "Feijão carioca cozido" correctly | It builds the line with the same function the feed screen uses, now shared in `features/feed/headline.ts` |
| D-7 | Low      | `GoalProgress.tsx`         | The streak badge called `FlameIcon` with no `className`, and that icon takes its size and colour from one | The flame rendered black at the browser's default size: the `viewBox` alone sets neither                                                                                        | `h-3.5 w-3.5 fill-act`. Measured after: `rgb(194, 65, 12)`                                                |

### Verified and fine

| Check                                                              | How it was verified                                                                                                                                                               | Date       |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| The partner's data is only reachable through the caller's own pair | The partner id comes from `getCurrentPair(callerId)`; there is no parameter that names a user. Read in full                                                                       | 2026-09-06 |
| The partner's e-mail is not exposed                                | `MemberView` carries it, `PartnerSummary` does not copy it. Read in full                                                                                                          | 2026-09-06 |
| No cross-pair read                                                 | `TenantIsolationIT` covers the endpoint                                                                                                                                           | 2026-09-06 |
| The screen survives a partial failure                              | The nine enrichment queries can each fail without blanking the page; only the summary and the pair are required. Counted in `DashboardPage.tsx`: eleven in the `useQueries` array | 2026-10-13 |

## Tests

| Test                                                | Type          | Risk it covers                                                         |
| --------------------------------------------------- | ------------- | ---------------------------------------------------------------------- |
| `DashboardServiceTest.agregaConsumoGastoEParceiro`  | unit          | The net and remaining arithmetic, and that the partner block is filled |
| `DashboardServiceTest.semParceiroQuandoParPendente` | unit          | R-1                                                                    |
| `TenantIsolationIT`                                 | integration   | Cross-pair reads                                                       |
| `frontend locales.test.ts`                          | frontend unit | D-2: every key exists in all four languages                            |
| `e2e/navigation.spec.ts`                            | browser       | That the dashboard renders and the routes are reachable                |

```bash
./mvnw test -Dtest=DashboardServiceTest
cd frontend && npm test
```

| `GoalProgress.test.tsx` (8 cases) | frontend unit | R-6 to R-8: the distance walked for both losing and gaining, no progress claimed when the weight went the other way, the goal being reached, the invitation to set a target, not asking somebody who keeps their weight, and the two badges |
| `DashboardPage.test.tsx` (1 new case) | frontend unit | D-6: the feed preview naming what happened instead of showing nothing |

### What is not covered

- **R-4**, the null-target branch, has no test.
- **The goal bar's starting weight** is tested through the component, which receives it
  ready. The rule that picks it, in `DashboardPage`, has no test of its own.
- **The order of the blocks** is not asserted anywhere: the screen was read in a browser and
  the order recorded above, but a change that moved the goal bar below the fold would fail
  nothing.
- **The controller**: the date defaulting is unexercised.
- **The partner's e-mail not leaking** is true by construction and not asserted; the test
  helper supplies one, so a regression that copied it through would pass both unit tests.
- **D-1 has no automated test.** It was found and verified in a browser, and the fix is
  proved the same way. A Playwright assertion on the season card would be the honest
  regression test and does not exist yet.

## How to verify in production

```sql
-- read only: profiles that would show a null target on the home screen
SELECT count(*) FROM users WHERE daily_calorie_target IS NULL;
```

```bash
# read only: the dashboard is one request; this is what it costs
curl -s -o /dev/null -w '%{time_total}s\n' -H "Authorization: Bearer $TOKEN" localhost:8081/api/v1/dashboard
```

## Known debt

| Item                                           | Impact                                            | When it is meant to be addressed                    |
| ---------------------------------------------- | ------------------------------------------------- | --------------------------------------------------- |
| No browser regression test for the season card | D-1 could come back unnoticed                     | Next change to the Playwright suite                 |
| D-3, two meanings of "remaining"               | Contradictory numbers for the same day            | Rename one; it is a contract change                 |
| D-5, 28 frozen layering inversions             | The ADR describes a rule the code follows loosely | Shrink the freeze feature by feature; never grow it |
| D-4, unbounded date                            | Harmless                                          | Next change here                                    |

## History

| Date       | Change                                                                                                                                                                                                                                                                                                                                          | Pull request |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 2026-10-13 | The screen stopped talking only about today. It opens with how far along the goal is, measured from the weight the person started at to the one they chose, with the level and the streak beside it. Found while building it: the feed preview was reading a column that is null on every new item, so four freshly logged meals showed no name | pending      |
| 2026-09-06 | D-1 and D-2 fixed, document created                                                                                                                                                                                                                                                                                                             | #32          |
