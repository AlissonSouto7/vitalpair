# Feature: dashboard

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-06

## What it is and where it lives

The home screen: what you ate, what you burned, where that leaves you against
your target, and the same three numbers for your partner. It is one request, so
the first screen after logging in is not a waterfall of six.

The feature owns no data. It reads three other features through their published
ports and does arithmetic.

|                   |                                                      |
| ----------------- | ---------------------------------------------------- |
| Frontend route    | `/dashboard`                                         |
| Who can access it | authenticated user                                   |
| Backend package   | `com.aps.vitalpair.dashboard` (9 classes, 266 lines) |
| Feature flag      | none                                                 |

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

| #   | Rule                                                                       | Why                                                                                                                          |
| --- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| R-1 | The partner block is null while the pair is pending                        | A solo user has a working dashboard, not an error                                                                            |
| R-2 | The partner is resolved from the caller's own pair, never from a parameter | It is the only thing that makes reading another user's totals legitimate                                                     |
| R-3 | The partner block carries name, avatar and four numbers, and nothing else  | No e-mail, no weight, no macro breakdown, no meal list. The membership check earns the right to a summary, not to everything |
| R-4 | An incomplete profile returns null targets rather than an error            | This is the first screen a new account sees                                                                                  |
| R-5 | `date` defaults to today                                                   |                                                                                                                              |

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

### Verified and fine

| Check                                                              | How it was verified                                                                                            | Date       |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ---------- |
| The partner's data is only reachable through the caller's own pair | The partner id comes from `getCurrentPair(callerId)`; there is no parameter that names a user. Read in full    | 2026-09-06 |
| The partner's e-mail is not exposed                                | `MemberView` carries it, `PartnerSummary` does not copy it. Read in full                                       | 2026-09-06 |
| No cross-pair read                                                 | `TenantIsolationIT` covers the endpoint                                                                        | 2026-09-06 |
| The screen survives a partial failure                              | The six enrichment queries can each fail without blanking the page; only the summary and the pair are required | 2026-09-06 |

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

### What is not covered

- **R-4**, the null-target branch, has no test.
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

| Date       | Change                                         | Pull request             |
| ---------- | ---------------------------------------------- | ------------------------ |
| 2026-09-06 | D-1 and D-2 fixed, document created (phase 13) | `docs/professional-docs` |
