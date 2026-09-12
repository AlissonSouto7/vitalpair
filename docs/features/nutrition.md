# Feature: nutrition

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-06

## What it is and where it lives

Logging what a person eats and telling them where they stand against their
targets for the day. Food comes from three places: a search against Open Food
Facts, a barcode lookup against the same API, or typed in by hand. A fourth path,
a photo analysed by AI, lives in the `mealvision` package and finishes here, by
posting a log like any other.

This is the reference feature for the architecture. When a layering question
comes up, the answer is whatever `nutrition` does.

|                   |                                                         |
| ----------------- | ------------------------------------------------------- |
| Frontend route    | `/nutrition`                                            |
| Who can access it | authenticated user; every endpoint requires a token     |
| Backend package   | `com.aps.vitalpair.nutrition` (42 classes, 1,199 lines) |
| Feature flag      | none                                                    |

## Architecture

| Layer           | Files                                                                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Controller      | `nutrition/infrastructure/web/NutritionController.java`                                                                                                               |
| Use case ports  | `SearchFoodUseCase`, `FindFoodByBarcodeUseCase`, `LogMealUseCase`, `DeleteFoodLogUseCase`, `GetDailyLogsUseCase`, `GetDailySummaryUseCase`, `GetFavoriteFoodsUseCase` |
| Service         | `nutrition/application/service/NutritionService.java` implements all seven                                                                                            |
| Output ports    | `FoodLogRepositoryPort`, `OpenFoodFactsPort`                                                                                                                          |
| Persistence     | `FoodLogJpaEntity`, `FoodLogJpaRepository`, `FoodLogPersistenceAdapter`, `FoodLogPersistenceMapper` (MapStruct)                                                       |
| External client | `OpenFoodFactsHttpClient` (RestClient), `OpenFoodFactsAdapter`, `OffResponses`                                                                                        |
| Frontend page   | `frontend/src/features/nutrition/NutritionPage.tsx` (368 lines) and `MealDetailModal.tsx`                                                                             |
| i18n namespace  | `nutrition`                                                                                                                                                           |

### Endpoints

All under `/api/v1/nutrition`, all requiring a valid access token.

| Method | Path                    | Action                                           |
| ------ | ----------------------- | ------------------------------------------------ |
| GET    | `/foods/search?q=`      | Search Open Food Facts by name                   |
| GET    | `/foods/barcode/{code}` | Look up one product by barcode; 404 when unknown |
| POST   | `/logs`                 | Log a meal. Publishes `MealLoggedEvent`          |
| GET    | `/logs?date=`           | The day's logs for the caller, oldest first      |
| DELETE | `/logs/{id}`            | Delete one of the caller's own logs              |
| GET    | `/summary?date=`        | Totals for the day against the caller's targets  |
| GET    | `/favorites`            | The caller's eight most repeated foods           |

The photo endpoint, `POST /api/v1/nutrition/photo`, is served by
`mealvision`'s `NutritionPhotoController` under the same URL prefix. It analyses
an image and returns candidate foods; it does not write a log. See
[meal-vision.md](meal-vision.md).

### Data

| Table                  | Created in                           | Notes                                                                                                   |
| ---------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `food_logs`            | `V2__create_food_logs.sql`           | `tenant_id` and `user_id` both `NOT NULL` with FKs. Indexes on `(tenant_id)` and `(user_id, logged_at)` |
| `food_logs.is_private` | `V7__feed_reactions_and_privacy.sql` | Default `FALSE`. A private log still scores points but is not shown to the partner                      |

Database constraints, not just application rules: `meal_type IN ('BREAKFAST',
'LUNCH', 'DINNER', 'SNACK')` and `source IN ('OPEN_FOOD_FACTS', 'MANUAL')`.

## Business rules

| #    | Rule                                                                                                                                           | Why                                                                                                                                               |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1  | `tenant_id` is copied from the user at write time, never taken from the request                                                                | A tenant id a client can send is a tenant id a client can change                                                                                  |
| R-2  | Null macros are stored as zero, not null                                                                                                       | The summary sums them. A null in one row would otherwise have to be handled at every read                                                         |
| R-3  | `loggedAt` defaults to now when the client does not send one                                                                                   | Backdating is allowed on purpose: people log lunch in the evening                                                                                 |
| R-4  | Deleting a log belonging to someone else returns 404, not 403                                                                                  | 403 confirms the id exists, which turns the endpoint into a probe for other people's records                                                      |
| R-5  | A day runs midnight to midnight in UTC (`ZoneOffset.UTC` in `FoodLogPersistenceAdapter`)                                                       | Consistent boundaries across the whole codebase. This is wrong for a user in `America/Sao_Paulo` after 21:00 local, recorded as N-3 below         |
| R-6  | The summary returns `remaining = null` when the user has no calorie target                                                                     | Showing "remaining: 2000" to someone who never set a target is a number invented by the server                                                    |
| R-7  | Favourites are the eight most frequently logged food names, with the most recent entry supplying the quantity and macros                       | Re-logging the same breakfast is the most common action in the app                                                                                |
| R-8  | A search failure returns an empty list, not an error                                                                                           | Open Food Facts being down should degrade the search box, not break the meal screen                                                               |
| R-9  | Open Food Facts is called with 3s connect and 5s read timeouts, retried at most twice and only on `ConnectException`, behind a circuit breaker | Detailed in [observability.md](observability.md). A read timeout means the server answered and went quiet; retrying that only multiplies the wait |
| R-10 | Logging a meal publishes `MealLoggedEvent` `AFTER_COMMIT` with `REQUIRES_NEW` listeners                                                        | Gamification, the feed and notifications all react. A listener failing must not roll back the meal the person just logged                         |

## Security findings

### Fixed

| ID  | Severity | File                         | What happened                                                                                                                                                                             | Measured impact                                                                                                                                                                                                                                        | Fix                                                                                                                                                                                                             |
| --- | -------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N-1 | Medium   | `NutritionController`        | The search and photo endpoints had no rate limit, and the photo one calls a paid API                                                                                                      | One account could issue unbounded paid calls                                                                                                                                                                                                           | `RateLimitFilter`: photo capped at 20 an hour per user. Search and barcode were later capped too (N-7): each is an outbound call to Open Food Facts, so one account could still make the API an unmetered proxy |
| N-2 | Low      | `OpenFoodFactsHttpClient`    | No timeouts on the outbound call                                                                                                                                                          | A stalled upstream held a request thread until the socket gave up. Not measured against real Open Food Facts; reproduced with a WireMock delay                                                                                                         | 3s connect, 5s read. `OpenFoodFactsSearchIT.aStalledUpstreamGivesUpOnTheReadTimeout`                                                                                                                            |
| N-4 | Low      | `NutritionController#search` | The query string was passed to Open Food Facts with no length bound, and an empty or single-character term still spent an outbound call                                                   | A wasted upstream call per junk query, unmetered                                                                                                                                                                                                       | `@Validated` on the controller, `@NotBlank @Size(min = 2, max = 100)` on `q`. `OpenFoodFactsSearchIT.aTooShortQueryIsRejectedWithoutReachingTheUpstream`                                                        |
| N-6 | Low      | `SearchTab.tsx`              | The food search field was a `type="text"` carrying its purpose in a placeholder alone, so a screen reader announced an unnamed edit box and the hint disappeared as soon as anybody typed | Everyone using a screen reader on the screen where meals are logged, since the screen existed. The accessibility walk did not see it: it exempts `input[type="search"]`, and it never reached the search tab because the walk stopped on the photo tab | `type="search"` with an `aria-label`. Found by the browser tests failing a deploy, once the walk was made to open a tab a free account can actually see                                                         |
| N-7 | Low      | `RateLimitFilter`            | Search and barcode were not in the rate-limit map, and the map was matched on the raw URI, so a trailing slash or doubled separator skipped the limit on any endpoint                     | An authenticated account could drive unbounded outbound calls, or slip the AI limits with a varied path. Not exploited live: the framework 404s the varied path before the controller                                                                  | Search and barcode capped at 60 a minute per user; `resolvePolicy` normalises the path and matches barcode by prefix. `RateLimitFilterTest`, `OpenFoodFactsSearchIT.searchIsCappedPerUser`                      |

### Open

| ID  | Severity      | File                           | What happens                                                                                             | Measured impact                                                                                                   | Why it is still open                                                                                                            |
| --- | ------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| N-3 | Low           | `FoodLogPersistenceAdapter:39` | The day boundary is UTC, so a meal logged after 21:00 in `America/Sao_Paulo` counts towards the next day | Every user in Brazil, for meals logged in the evening. Not measured against real data because nothing is deployed | Fixing it means a user timezone column and a decision about historical rows. Backlogged                                         |
| N-5 | Informational | `FoodSource`                   | A meal identified from a photo is stored as `MANUAL`, indistinguishable from one typed by hand           | The share of logs that came from AI cannot be measured after the fact                                             | Adding a `PHOTO` value means a new migration and a CHECK constraint change. Worth doing before the AI path matters commercially |

### Verified and fine

| Check                                         | How it was verified                                                                                                                                                                                                       | Date       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Every read of user-owned data is scoped       | `findByUserAndDate` and `findTopByUser` filter by `user_id`, which is strictly narrower than `tenant_id`: a user belongs to exactly one pair. `TenantIsolationIT` confirms no cross-pair read on every nutrition endpoint | 2026-09-06 |
| Delete checks ownership before deleting       | `NutritionService:115` compares `log.getUserId()` to the caller. `NutritionServiceTest.deleteDeRegistroDeOutroUsuarioRetornaNotFound`                                                                                     | 2026-09-06 |
| No mass assignment                            | `LogMealRequest` is a record with only the fields the client may set; `tenantId` and `userId` are not among them and are filled from the session                                                                          | 2026-09-06 |
| Input validated on the server                 | `@Valid` on `LogMealRequest`, plus database CHECK constraints on `meal_type` and `source`                                                                                                                                 | 2026-09-06 |
| Queries are parameterised                     | Spring Data derived queries and one `@Query` with named parameters; no string concatenation, confirmed by reading `FoodLogJpaRepository`                                                                                  | 2026-09-06 |
| Open Food Facts sends the required User-Agent | Their API blocks anonymous clients. `OpenFoodFactsSearchIT.searchReturnsOnlyNamedProductsAndSendsTheRequiredUserAgent` asserts the header on the captured request                                                         | 2026-09-06 |

## Tests

| Test                                                                 | Type        | Risk it covers                                                                                                                                                                               |
| -------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NutritionServiceTest.logMealUsaTenantDoUsuarioEPreencheZerosEData`  | unit        | R-1, R-2, R-3: tenant comes from the user, nulls become zero, the timestamp defaults                                                                                                         |
| `NutritionServiceTest.deleteDeRegistroDeOutroUsuarioRetornaNotFound` | unit        | R-4, the IDOR on delete                                                                                                                                                                      |
| `NutritionServiceTest.getSummarySomaConsumoECalculaRestante`         | unit        | The summary arithmetic and the remaining calculation                                                                                                                                         |
| `NutritionServiceTest.findByBarcodeInexistenteLancaNotFound`         | unit        | An unknown barcode is a 404, not an empty product                                                                                                                                            |
| `OpenFoodFactsSearchIT` (7 cases)                                    | integration | R-8, R-9, N-2: the User-Agent, an outage degrading to an empty list, the read timeout, a dropped connection, a known barcode, an unknown one as 404, and that search requires authentication |
| `TenantIsolationIT`                                                  | integration | Cross-pair reads on every nutrition endpoint                                                                                                                                                 |
| `RateLimitIT`                                                        | integration | N-1, on the photo endpoint                                                                                                                                                                   |

```bash
./mvnw test -Dtest=NutritionServiceTest
./mvnw verify -Dit.test=OpenFoodFactsSearchIT
```

### What is not covered

- **The real Open Food Facts API.** Every test runs against WireMock replaying captured
  fixtures. A change to their response shape would not be caught here.
- **Concurrent logs.** Two requests logging a meal at the same instant are not tested.
  Nothing is decremented and no uniqueness is claimed, so the expected result is simply two
  rows, but that is reasoning, not a measurement.
- **The summary at a day boundary.** No test covers a meal logged at 23:59 UTC, which is
  where N-3 shows.
- **Favourites with a food logged under two spellings.** Grouping is by exact name, so
  "Banana" and "banana" are two entries. No test asserts either behaviour.
- **A very large day.** No test covers a user with hundreds of logs in one day; the summary
  loads them all into memory.
- **The frontend nutrition page.** Covered by no Playwright test. The browser suite exercises
  authentication, navigation and accessibility only.

## How to verify in production

```sql
-- read only: logs by source over the last week
SELECT source, count(*) FROM food_logs
WHERE logged_at > now() - interval '7 days' GROUP BY source;

-- read only: a log whose tenant does not match its user would be a bug in R-1
SELECT count(*) FROM food_logs f JOIN users u ON u.id = f.user_id
WHERE f.tenant_id <> u.tenant_id;

-- read only: rows that would break the summary if R-2 ever regressed
SELECT count(*) FROM food_logs
WHERE protein_g IS NULL OR carb_g IS NULL OR fat_g IS NULL;
```

```bash
# read only: is the Open Food Facts breaker closed?
curl -s localhost:9090/actuator/prometheus | grep 'resilience4j_circuitbreaker_state.*openfoodfacts'
```

## Known debt

| Item                                               | Impact                                                                                                                                 | When it is meant to be addressed              |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| N-3, UTC day boundary                              | Evening meals in Brazil count towards the next day                                                                                     | Needs a user timezone; backlogged             |
| N-5, photo logs indistinguishable from manual      | The AI path cannot be measured                                                                                                         | Before the AI feature is charged for          |
| No pagination on `GET /logs`                       | A day with hundreds of logs is one large response                                                                                      | Backlog: pagination across all list endpoints |
| `NutritionServiceTest` method names are Portuguese | Predates the English rule                                                                                                              | Next time the file is touched                 |
| `NutritionPage.tsx` was 942 lines and is now 368   | It was decomposed into `DayList`, `SearchTab`, `FavoritesTab`, `PhotoTab`, `MealEditor`, `SaveBar` and `parts`, each with its own file | Done                                          |

## History

| Date       | Change                                                                                                                                                                                                                                          | Pull request                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 2026-09-11 | N-6: the food search field got an accessible name. The paid-plan gate closed the photo tab for free accounts, which made the accessibility walk fail a deploy, and opening the search tab instead revealed a control that had never had a label | #99                             |
| 2026-09-05 | Timeouts, rate limit on the photo path                                                                                                                                                                                                          | `fix/security-hardening`        |
| 2026-09-05 | Circuit breaker and narrowed retry                                                                                                                                                                                                              | `feat/observability-resilience` |
| 2026-09-06 | Document created                                                                                                                                                                                                                                | #32                             |
