# Feature: feed

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-15

## What it is and where it lives

The shared timeline of a pair: what each person logged, when, and what it was
worth, with three reactions to answer it. It is the only place one person sees
what the other actually did, which is what makes the privacy toggle matter.

The feed writes nothing of its own accord. It listens for meals and activities
and stores what was logged. It stores the facts, not a sentence: the screen
writes the words, so the timeline reads in the language the person chose.

|                   |                                                  |
| ----------------- | ------------------------------------------------ |
| Frontend route    | `/feed`                                          |
| Who can access it | authenticated user, their own pair's feed        |
| Backend package   | `com.aps.vitalpair.feed` (23 classes, 760 lines) |
| Feature flag      | none                                             |

## Architecture

| Layer          | Files                                                  |
| -------------- | ------------------------------------------------------ |
| Controller     | `feed/infrastructure/web/FeedController.java`          |
| Listener       | `feed/application/listener/FeedEventListener.java`     |
| Services       | `FeedService`, `ReactionService`                       |
| Output ports   | `FeedItemRepositoryPort`, `FeedReactionRepositoryPort` |
| Frontend page  | `FeedPage.tsx`                                         |
| i18n namespace | `feed`                                                 |

### Endpoints

| Method | Path                                          | Action                                                             |
| ------ | --------------------------------------------- | ------------------------------------------------------------------ |
| GET    | `/api/v1/pair/feed?page=&size=`               | The pair's timeline, newest first. `size` capped at 50, default 20 |
| POST   | `/api/v1/pair/feed/{itemId}/reactions`        | React with `FIRE`, `EYE` or `STRENGTH`                             |
| DELETE | `/api/v1/pair/feed/{itemId}/reactions/{type}` | Remove your own reaction                                           |

### Data

| Table                                             | Created in                                 | Notes                                                                                                                                                                                                                                                                |
| ------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `feed_items`                                      | `V5__create_feed_items.sql`                | `type IN ('MEAL_LOGGED','ACTIVITY_LOGGED')`, index on `(tenant_id, created_at DESC)`                                                                                                                                                                                 |
| `feed_items.is_private`                           | `V7__feed_reactions_and_privacy.sql`       | Default false                                                                                                                                                                                                                                                        |
| `feed_items.points`, `.subtitle`                  | `V14__feed_items_points_and_subtitle.sql`  |                                                                                                                                                                                                                                                                      |
| `feed_items.source_id` and the structured columns | `V29__feed_items_source_and_structure.sql` | `source_id` links the item to the `food_logs` or `activity_logs` row; `meal_type`, `activity_type`, `food_name`, `calories`, the macros and `duration_minutes` replace the rendered sentence. Expand only: `title` became nullable and old rows still render from it |
| `feed_reactions`                                  | `V7`                                       | `UNIQUE (feed_item_id, user_id, type)`, `ON DELETE CASCADE` from the item                                                                                                                                                                                            |

## Business rules

| #    | Rule                                                                            | Why                                                                                                                                                                                                                   |
| ---- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1  | The feed shows items of the caller's tenant that are either public or their own | One query, one predicate: `tenantId = ? AND (isPrivate = false OR userId = ?)`. It is the whole privacy guarantee                                                                                                     |
| R-2  | A private meal is invisible to the partner and visible to its author            | Hiding it from its author would make the toggle pointless                                                                                                                                                             |
| R-3  | A private meal still scores                                                     | Privacy that cost points would be a penalty, and the partner would infer the meal from the points that never arrived. See [gamification.md](gamification.md)                                                          |
| R-4  | Reacting is idempotent                                                          | Enforced twice: an `exists` check and a unique constraint                                                                                                                                                             |
| R-5  | Reacting to another pair's item is a 404, not a 403                             | A 403 confirms the id exists, turning the endpoint into a probe                                                                                                                                                       |
| R-6  | You can only delete your own reaction                                           | The delete is keyed on `(item, user, type)`                                                                                                                                                                           |
| R-7  | Reaction counts are fetched in one query for the whole page, not one per item   | A timeline that issues a query per card gets slower as it gets more useful                                                                                                                                            |
| R-8  | `size` is capped at 50                                                          | An uncapped page size is a way to ask the server for the entire table                                                                                                                                                 |
| R-9  | Deleting a meal or an activity removes its feed item                            | A deletion that empties the diary and leaves the timeline intact is not a deletion. Driven by `MealDeletedEvent`/`ActivityDeletedEvent` and `source_id`, scoped by tenant so a forged event cannot reach another pair |
| R-10 | The listener writes no points                                                   | It cannot see what gamification awarded: both listen to the same event, after the same commit, in no defined order. Zero is the honest default, and the screen shows no badge for it                                  |
| R-11 | The item stores the type and the numbers, never a rendered sentence             | A stored sentence cannot follow a language change, because it was written before the change. See FD-6                                                                                                                 |

## Security findings

### Fixed

| ID   | Severity | File             | What happened                                                                                                                                                                                                                                                                                | Measured impact                                                                                                                                                | Fix                                                                                                                                                                                                                                                                                                                                 |
| ---- | -------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FD-1 | Low      | `FeedController` | `page` and `size` had no lower bound. `size` was capped above but not below, so a negative value reached `PageRequest.of` and threw: bad input came back as **HTTP 500** with a stack trace in the log. Confirmed against the running instance: `GET /api/v1/pair/feed?size=-1` returned 500 | Any caller could produce it on themselves; no data was exposed. The cost is in the log, where a stack trace for ordinary bad input buries the ones that matter | `@Min` on both parameters with `@Validated` on the controller, plus a handler for `ConstraintViolationException`, which had no handler at all and so fell through to the generic 500. `FeedPaginationIT.anImpossiblePageIsRefusedRatherThanCrashing` covers four values. Proved non-vacuous: without the bounds all four return 500 |

| FD-6 | Medium | `FeedEventListener`, `feed_items` | The item stored a finished Portuguese sentence, built on the server, and the separator was an em dash the writing rules forbid. With the interface in English the timeline stayed in Portuguese, and switching language changed nothing because the words were already in the database | Every item ever written. Every reader who is not reading Portuguese | The listener stores the type and the numbers; the screen composes the line through `t()` with the middle dot the rest of the app uses. Rows written before V29 keep their sentence rather than vanishing |
| FD-7 | **High** | `FeedEventListener`, `feed_items.points` | The "+10 pts" badge was a constant stamped on every row. Points are awarded only for the first record of the day of each type, so most items advertised points nobody received | Measured on the local database before the fix: the timeline claimed 625 points against 305 in the ledger, over 57 items | The listener writes no points; V29 corrected existing rows against `point_events`, reading both sides through `users.time_zone`. After it, every user/day/type bucket reconciles and the totals match at 305 |
| FD-8 | **High** | `NutritionService`, `feed_items` | Deleting a meal left its feed item in place, with its points badge. Nothing linked the item to the record, so there was no way to find the one to remove | The partner went on reading a meal that no longer existed. Confirmed on a running server with two paired accounts | `source_id` plus a deletion event. Verified on the same pair: delete the meal, the diary empties and the item is gone from the partner's feed |

### Open

| ID   | Severity      | File                                           | What happens                                                                                         | Measured impact                                                                                                                                      | Why it is still open                                                                  |
| ---- | ------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| FD-2 | Low           | `FeedEventListener`                            | Activities have no privacy flag: `ActivityLoggedEvent` carries none, and the listener writes `false` | A user who marks meals private has no equivalent control over workouts                                                                               | Product gap. Worth deciding before the toggle is advertised as covering "what you do" |
| FD-3 | Low           | `FeedEventListener`                            | The insert is unconditional, with no dedup key                                                       | Combined with AC-1 in [activity.md](activity.md), a duplicated wearable sync produces duplicate cards and duplicate points                           | Solve with AC-1                                                                       |
| FD-4 | Low           | `FeedReactionJpaRepository#findByFeedItemIdIn` | Reads reactions keyed only on item ids, with no tenant or user filter                                | Not exploitable: the ids come from an already tenant-scoped page. But nothing in the query itself prevents a future caller passing ids from anywhere | Worth scoping the query rather than relying on every caller                           |
| FD-5 | Informational | `FeedEventListener`                            | One `findById` on the user per event, to read a name already denormalised into `actor_name`          | One extra query per meal and per activity                                                                                                            | The event could carry the name. Small, real                                           |

### Verified and fine

| Check                                                     | How it was verified                                                                                                                                                                                                       | Date       |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| A private meal never reaches the partner's feed           | `MealPrivacyIT.aPrivateMealNeverReachesThePartnersFeed`. Proved non-vacuous: widening the predicate to also match private items turns it red                                                                              | 2026-09-06 |
| The author still sees their own private meal              | `MealPrivacyIT.theAuthorStillSeesTheirOwnPrivateMeal`                                                                                                                                                                     | 2026-09-06 |
| A private meal is not visible to an unrelated pair either | `MealPrivacyIT.aPrivateMealIsNotVisibleThroughAnotherPairsFeedEither`                                                                                                                                                     | 2026-09-06 |
| Reacting across tenants fails                             | `ReactionServiceTest.naoReageEmItemDeOutroTenant` asserts the exception and that nothing was saved; `TenantIsolationIT.reactingToAnotherPairsFeedItemFails` covers it over HTTP                                           | 2026-09-06 |
| The feed shows only the own pair's activity               | `TenantIsolationIT.theFeedShowsOnlyTheOwnPairsActivity`                                                                                                                                                                   | 2026-09-06 |
| What an item stores, and what it does not                 | `FeedEventListenerTest` pins the structured fields, the source id, the private flag and that points stay zero. Proved non-vacuous: restoring the hardcoded 10/15 and a pre-rendered Portuguese title turns 3 of the 8 red | 2026-09-15 |
| A deleted record takes its item with it                   | `FeedEventListenerTest.deletingAmealRemovesItsItem` and `deletingAnactivityRemovesItsItem`, plus the paired-account run on a live server                                                                                  | 2026-09-15 |

## Tests

| Test                              | Type        | Risk it covers                                                                                                                                                                                                                                 |
| --------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MealPrivacyIT` (4 cases)         | integration | R-1, R-2, R-3, and cross-pair invisibility                                                                                                                                                                                                     |
| `FeedEventListenerTest` (8 cases) | unit        | What an item stores (R-11), the source link (R-9), points staying zero (R-10), privacy, and a missing profile still producing an item                                                                                                          |
| `FeedServiceTest` (7 cases)       | unit        | Reaction counts grouped per item and per type; "mine" holding only the caller's; empty maps rather than nulls; the whole page costing one reaction query; the tenant coming from the stored profile; the paging envelope surviving the mapping |
| `ReactionServiceTest` (2 cases)   | unit        | R-5, and that the tenant guard does not block legitimate reactions                                                                                                                                                                             |
| `FeedPaginationIT` (6 cases)      | integration | FD-1, the cap at 50, and the defaults                                                                                                                                                                                                          |
| `TenantIsolationIT`               | integration | The feed and the reaction endpoint across pairs                                                                                                                                                                                                |

```bash
./mvnw verify -Dit.test='MealPrivacyIT,FeedPaginationIT'
./mvnw test -Dtest='FeedEventListenerTest,ReactionServiceTest'
```

### What is not covered

- **`FeedService.getFeed` has no unit test**: the reaction-count grouping and the "which of
  these are mine" filter are only exercised incidentally by the integration tests.
- **`removeReaction`** has no test at all.
- **A feed longer than one page**: no test asks for page 1 with content on it.

## How to verify in production

```sql
-- read only: private items should never be a large share; if they are, the feature is being used as a hiding place
SELECT is_private, count(*) FROM feed_items GROUP BY 1;

-- read only: an item whose tenant does not match its user would break R-1
SELECT count(*) FROM feed_items f JOIN users u ON u.id = f.user_id WHERE f.tenant_id <> u.tenant_id;

-- read only: duplicate reactions would mean the unique constraint was lost
SELECT feed_item_id, user_id, type, count(*) FROM feed_reactions GROUP BY 1,2,3 HAVING count(*) > 1;
```

## Known debt

| Item                               | Impact                                          | When it is meant to be addressed |
| ---------------------------------- | ----------------------------------------------- | -------------------------------- |
| FD-2, activities cannot be private | The privacy control is narrower than it appears | Product decision                 |
| FD-3, no listener idempotency      | Duplicate cards the day an integration ships    | With AC-1                        |
| FD-4, unscoped reaction lookup     | Safe today, fragile                             | Next change here                 |
| `FeedService` untested             | The grouping logic can drift silently           | Next change here                 |

## History

| Date       | Change                                                                                                                                                                                                                                             | Pull request           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 2026-09-15 | V29: items store the source id and the facts instead of a rendered sentence. Deleting a meal or an activity now removes its item, the points badge stopped claiming awards nobody received, and 29 existing rows were corrected against the ledger | `fix/screen-sweep`     |
| 2026-09-11 | `FeedService` got its first test: seven cases over the reaction counts, which reactions are the caller's own, and the single query the whole page costs                                                                                            | `fix/audit-loose-ends` |
| 2026-09-06 | `MealPrivacyIT` added, document created                                                                                                                                                                                                            | #32                    |
