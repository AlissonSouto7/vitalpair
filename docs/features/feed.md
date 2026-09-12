# Feature: feed

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-06

## What it is and where it lives

The shared timeline of a pair: what each person logged, when, and what it was
worth, with three reactions to answer it. It is the only place one person sees
what the other actually did, which is what makes the privacy toggle matter.

The feed writes nothing of its own accord. It listens for meals and activities
and builds a card from the event.

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

| Table                            | Created in                                | Notes                                                                                |
| -------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| `feed_items`                     | `V5__create_feed_items.sql`               | `type IN ('MEAL_LOGGED','ACTIVITY_LOGGED')`, index on `(tenant_id, created_at DESC)` |
| `feed_items.is_private`          | `V7__feed_reactions_and_privacy.sql`      | Default false                                                                        |
| `feed_items.points`, `.subtitle` | `V14__feed_items_points_and_subtitle.sql` |                                                                                      |
| `feed_reactions`                 | `V7`                                      | `UNIQUE (feed_item_id, user_id, type)`, `ON DELETE CASCADE` from the item            |

## Business rules

| #   | Rule                                                                            | Why                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-1 | The feed shows items of the caller's tenant that are either public or their own | One query, one predicate: `tenantId = ? AND (isPrivate = false OR userId = ?)`. It is the whole privacy guarantee                                            |
| R-2 | A private meal is invisible to the partner and visible to its author            | Hiding it from its author would make the toggle pointless                                                                                                    |
| R-3 | A private meal still scores                                                     | Privacy that cost points would be a penalty, and the partner would infer the meal from the points that never arrived. See [gamification.md](gamification.md) |
| R-4 | Reacting is idempotent                                                          | Enforced twice: an `exists` check and a unique constraint                                                                                                    |
| R-5 | Reacting to another pair's item is a 404, not a 403                             | A 403 confirms the id exists, turning the endpoint into a probe                                                                                              |
| R-6 | You can only delete your own reaction                                           | The delete is keyed on `(item, user, type)`                                                                                                                  |
| R-7 | Reaction counts are fetched in one query for the whole page, not one per item   | A timeline that issues a query per card gets slower as it gets more useful                                                                                   |
| R-8 | `size` is capped at 50                                                          | An uncapped page size is a way to ask the server for the entire table                                                                                        |

## Security findings

### Fixed

| ID   | Severity | File             | What happened                                                                                                                                                                                                                                                                                | Measured impact                                                                                                                                                | Fix                                                                                                                                                                                                                                                                                                                                 |
| ---- | -------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FD-1 | Low      | `FeedController` | `page` and `size` had no lower bound. `size` was capped above but not below, so a negative value reached `PageRequest.of` and threw: bad input came back as **HTTP 500** with a stack trace in the log. Confirmed against the running instance: `GET /api/v1/pair/feed?size=-1` returned 500 | Any caller could produce it on themselves; no data was exposed. The cost is in the log, where a stack trace for ordinary bad input buries the ones that matter | `@Min` on both parameters with `@Validated` on the controller, plus a handler for `ConstraintViolationException`, which had no handler at all and so fell through to the generic 500. `FeedPaginationIT.anImpossiblePageIsRefusedRatherThanCrashing` covers four values. Proved non-vacuous: without the bounds all four return 500 |

### Open

| ID   | Severity      | File                                           | What happens                                                                                         | Measured impact                                                                                                                                      | Why it is still open                                                                  |
| ---- | ------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| FD-2 | Low           | `FeedEventListener`                            | Activities have no privacy flag: `ActivityLoggedEvent` carries none, and the listener writes `false` | A user who marks meals private has no equivalent control over workouts                                                                               | Product gap. Worth deciding before the toggle is advertised as covering "what you do" |
| FD-3 | Low           | `FeedEventListener`                            | The insert is unconditional, with no dedup key                                                       | Combined with AC-1 in [activity.md](activity.md), a duplicated wearable sync produces duplicate cards and duplicate points                           | Solve with AC-1                                                                       |
| FD-4 | Low           | `FeedReactionJpaRepository#findByFeedItemIdIn` | Reads reactions keyed only on item ids, with no tenant or user filter                                | Not exploitable: the ids come from an already tenant-scoped page. But nothing in the query itself prevents a future caller passing ids from anywhere | Worth scoping the query rather than relying on every caller                           |
| FD-5 | Informational | `FeedEventListener`                            | One `findById` on the user per event, to read a name already denormalised into `actor_name`          | One extra query per meal and per activity                                                                                                            | The event could carry the name. Small, real                                           |

### Verified and fine

| Check                                                     | How it was verified                                                                                                                                                             | Date       |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| A private meal never reaches the partner's feed           | `MealPrivacyIT.aPrivateMealNeverReachesThePartnersFeed`. Proved non-vacuous: widening the predicate to also match private items turns it red                                    | 2026-09-06 |
| The author still sees their own private meal              | `MealPrivacyIT.theAuthorStillSeesTheirOwnPrivateMeal`                                                                                                                           | 2026-09-06 |
| A private meal is not visible to an unrelated pair either | `MealPrivacyIT.aPrivateMealIsNotVisibleThroughAnotherPairsFeedEither`                                                                                                           | 2026-09-06 |
| Reacting across tenants fails                             | `ReactionServiceTest.naoReageEmItemDeOutroTenant` asserts the exception and that nothing was saved; `TenantIsolationIT.reactingToAnotherPairsFeedItemFails` covers it over HTTP | 2026-09-06 |
| The feed shows only the own pair's activity               | `TenantIsolationIT.theFeedShowsOnlyTheOwnPairsActivity`                                                                                                                         | 2026-09-06 |
| Card copy and point values                                | `FeedEventListenerTest` pins both titles, both subtitles and the 10/15 point values                                                                                             | 2026-09-06 |

## Tests

| Test                              | Type        | Risk it covers                                                                                                                                                                                                                                 |
| --------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MealPrivacyIT` (4 cases)         | integration | R-1, R-2, R-3, and cross-pair invisibility                                                                                                                                                                                                     |
| `FeedEventListenerTest` (2 cases) | unit        | The card's copy and its point value drifting                                                                                                                                                                                                   |
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

| Date       | Change                                                                                                                                                  | Pull request           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 2026-09-11 | `FeedService` got its first test: seven cases over the reaction counts, which reactions are the caller's own, and the single query the whole page costs | `fix/audit-loose-ends` |
| 2026-09-06 | `MealPrivacyIT` added, document created                                                                                                                 | #32                    |
