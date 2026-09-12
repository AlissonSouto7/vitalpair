# Feature: pair

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-08

## What it is and where it lives

Two people joining up. One generates an invite code, the other opens the link and
accepts, and from that moment the two share a feed, a weekly scoreboard and a
season.

It is also the root of the data model. A pair **is** the tenant: `pairs.id` is the
`tenant_id` carried by every business table. Registering creates a pair of one in
`PENDING`, so nobody exists without a tenant, and joining is the only operation in
the product that moves a person from one tenant to another.

|                   |                                                          |
| ----------------- | -------------------------------------------------------- |
| Frontend routes   | `/pair`, `/convite/:code`                                |
| Who can access it | authenticated, except the invite preview which is public |
| Backend package   | `com.aps.vitalpair.pair` (23 classes, 628 lines)         |
| Feature flag      | none                                                     |

## Architecture

| Layer          | Files                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Controller     | `pair/infrastructure/web/PairController.java`                                                                                                       |
| Use case ports | `GetCurrentPairUseCase`, `GenerateInviteUseCase`, `JoinPairUseCase`, `LeavePairUseCase`, `UpdateRelationshipTypeUseCase`, `GetInvitePreviewUseCase` |
| Service        | `pair/application/service/PairService.java` implements all six                                                                                      |
| Domain         | `InviteCode` (the alphabet and length, moved here from `AuthService`), `PairStatus`, `Pair`                                                         |
| Output ports   | `PairRepositoryPort`, `TenantDataMigrationPort`                                                                                                     |
| Persistence    | `PairJpaEntity`, `PairJpaRepository`, `PairPersistenceAdapter`, `PairPersistenceMapper`, `TenantDataMigrationAdapter`                               |
| Frontend pages | `PairPage.tsx`, `InvitePage.tsx`                                                                                                                    |
| i18n namespace | `pair`                                                                                                                                              |

### Endpoints

| Method | Path                         | Action                                                                | Who can call it |
| ------ | ---------------------------- | --------------------------------------------------------------------- | --------------- |
| GET    | `/api/v1/pair`               | The caller's pair with its members                                    | authenticated   |
| POST   | `/api/v1/pair/invite`        | The invite code; 422 if already paired                                | authenticated   |
| GET    | `/api/v1/pair/invite/{code}` | Preview: inviter's first name, relationship type, whether it is taken | **public**      |
| POST   | `/api/v1/pair/join/{code}`   | Accept an invite                                                      | authenticated   |
| DELETE | `/api/v1/pair/membership`    | End the pair; 422 when there is no partner                            | authenticated   |
| PUT    | `/api/v1/pair/type`          | Change the relationship label                                         | authenticated   |

The preview is public because the invite link is opened by someone who has no
account yet. It is the only unauthenticated route outside `/api/v1/auth`, listed
explicitly in `SecurityConfig`.

### Data

| Table                     | Created in                      | Notes                                                                                                                        |
| ------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `pairs`                   | `V1__init_users_and_pairs.sql`  | `invite_code` is `NOT NULL UNIQUE`. `user1_id` is nullable to break the FK cycle at registration: pair, then user, then link |
| `pairs.relationship_type` | `V8__add_relationship_type.sql` | `CHECK IN ('PAIR','DUO','FRIENDS','CONFIDANTS','BROTHERS','OTHER')`, default `PAIR`                                          |
| `pairs.status`            | `V25__pair_status_ended.sql`    | `CHECK IN ('PENDING','ACTIVE','PAUSED','ENDED')`. `ENDED` was added when leaving became possible                             |

Measured against the database catalogue on 2026-09-06: **twelve foreign keys point
at `pairs`, every one of them `NO ACTION`**, and twelve tables besides `users`
carry a `tenant_id`. Nine of those also carry `user_id` (`food_logs`,
`activity_logs`, `feed_items`, `notifications`, `point_events`, `user_badges`,
`user_streaks`, `meal_plans`, `workout_plans`); three describe the pair itself
(`competition_scores`, `pair_missions`, `seasons`). That split is what the join
logic is built around. `notifications` carries `tenant_id` with **no** foreign
key, which is why an orphan there would be silent rather than an error.

Two user-owned tables are deliberately absent from that list of nine, and it is
worth saying so because their absence looks like an oversight: `weight_logs`
(`V18`) and `notification_preferences` (`V19`) carry `user_id` and **no**
`tenant_id`. They follow the person by construction, so there is nothing to
migrate. Verified against the migrations on 2026-09-08.

## Business rules

| #    | Rule                                                                                                            | Why                                                                                                                                                                                                |
| ---- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1  | Registration creates a pair of one in `PENDING`, and the user's `tenant_id` is that pair                        | There is no valid state in which a user has no tenant, so no query has to handle one                                                                                                               |
| R-2  | Joining moves the guest into the inviter's tenant, **and moves everything they had already recorded with them** | Rows left behind block the delete of the abandoned pair and would be invisible to every tenant-scoped query afterwards. See P-1                                                                    |
| R-3  | The three pair-owned tables of the abandoned tenant are discarded, not migrated                                 | Their weekly score is one person's solo total sitting in `user1_score`. Carrying it over would credit it to whichever slot the joiner takes in the new pair, which is a number nobody earned there |
| R-4  | An invite can be accepted once: the code is refused if the pair is not `PENDING` or already has a second member | Otherwise a link shared publicly lets a stranger into the pair                                                                                                                                     |
| R-5  | You cannot join your own invite                                                                                 | A pair of one person with themselves would break every you-versus-rival read                                                                                                                       |
| R-6  | Someone who already has an `ACTIVE` pair cannot join another                                                    | Joining a second pair would strand the first partner. Ending the first one is the way through, and it is now a feature: see R-11                                                                   |
| R-7  | Generating an invite when already paired is a 422, not a new code                                               | Same reason                                                                                                                                                                                        |
| R-8  | The pair name is built as `<inviter> & <joiner>` at the moment of joining                                       | Nobody has to name it, and it reads correctly on the dashboard from the first second                                                                                                               |
| R-9  | The public preview returns only the inviter's **first** name, never the e-mail                                  | The code is guessable; anything beyond a first name would turn the endpoint into a directory                                                                                                       |
| R-10 | The invite alphabet is `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, eight characters                                     | `I`, `O`, `0` and `1` are excluded because the code is read aloud and typed by the partner. 32^8 is about 1.1 trillion combinations                                                                |
| R-11 | Leaving ends the pair for **both** people at once, not only for the one who asked                               | Letting one keep the tenant would leave them holding the other's meals, weights and score: rows the person who left can no longer reach, since every query is scoped by tenant                     |
| R-12 | The ended pair keeps its seasons, weekly scores and point ledger; the row survives as `ENDED`                   | The season history is summed live from the ledger on every read. Deleting the rows would recompute every past season with a rival score of zero and hand the loser the win. See R-13               |
| R-13 | Each person leaves with what they personally recorded, migrated into a fresh `PENDING` tenant                   | `users.tenant_id` is `NOT NULL`, so leaving is not clearing a column: it is minting a pending pair and moving into it, which is what registration already does for a new account                   |

## Security findings

### Fixed

| ID  | Severity | File                   | What happened                                                                                                                                                                                                                                                                                                     | Measured impact                                                                                                                                                                                                        | Fix                                                                                                                                                                                                                                                                       |
| --- | -------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-1 | High     | `PairService#joinPair` | A guest who had used the app before pairing up could not join at all. The service moved the user's `tenant_id` but not their rows, then deleted the abandoned pair, which Postgres refused: `update or delete on table "pairs" violates foreign key constraint "food_logs_tenant_id_fkey"`. The user saw HTTP 500 | Every guest who logged a single meal, activity or plan before accepting an invite. Reproduced end to end in `PairFormationIT.aGuestWhoAlreadyLoggedAMealCanStillJoin`, which returned 500 before the fix and 200 after | `TenantDataMigrationPort` reassigns the nine user-owned tables and discards the three pair-owned ones before the delete. The run log shows what moved: `Moved 5 rows of user ... from tenant ... to ...` followed by `Discarded 1 rows belonging to abandoned tenant ...` |

### Open

| ID  | Severity      | File                                 | What happens                                                                                                     | Measured impact                                                                                                                                                      | Why it is still open                                                                                                                                    |
| --- | ------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-2 | Low           | `PairController#invitePreview`       | The public preview has no rate limit, so invite codes can be probed                                              | 32^8 combinations makes a hit implausible, and a hit reveals only a first name and whether the pair is taken. Not measured against a running deployment              | The value returned is small enough that a limit would mostly be ceremony. Worth adding when the product is public                                       |
| P-3 | Low           | `PairService#updateRelationshipType` | The caller's membership of the pair is never asserted; only that the pair is the one their `tenant_id` points at | Not reachable today: `tenant_id` is only ever written by registration and by joining, both of which put the user in a slot. So this is a latent gap, not a live hole | Closing it means a membership check in five methods. Recorded rather than fixed, because the invariant that makes it unreachable is itself worth a test |
| P-4 | Informational | none                                 | There is no way to leave a pair                                                                                  | A pair formed by mistake is permanent                                                                                                                                | Product decision, not a defect. It is what R-6 leans on                                                                                                 |

### Verified and fine

| Check                                        | How it was verified                                                                                                                                                                                      | Date       |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| The invite code cannot be reused             | `PairFormationIT.anInviteCodeCannotBeUsedTwice`: the second person gets 422                                                                                                                              | 2026-09-06 |
| The public preview does not leak the address | `PairFormationIT.theInvitePreviewIsPublicAndRevealsOnlyTheFirstName` asserts the body contains no `@` and only the first name of "Maria Fernanda Souza"                                                  | 2026-09-06 |
| No cross-tenant read after joining           | `TenantIsolationIT` builds two pairs with distinguishable data and checks every authenticated endpoint                                                                                                   | 2026-09-06 |
| Codes come from a cryptographic source       | `PairService` uses `SecureRandom`, not `Math.random` or `Random`                                                                                                                                         | 2026-09-06 |
| The guest's data survives the move           | `PairFormationIT.aGuestWhoAlreadyLoggedAMealCanStillJoin` reads the meal back after joining and finds it                                                                                                 | 2026-09-06 |
| The migration runs before the delete         | `PairServiceTest.joinMovesTheGuestsExistingDataBeforeDeletingTheOldTenant` asserts the order with `InOrder`. Proved non-vacuous: removing the migration call makes it fail with "Wanted but not invoked" | 2026-09-06 |

## Tests

| Test                           | Type        | Risk it covers                                                                                                                                                   |
| ------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PairServiceTest` (8 cases)    | unit        | Tenant move, own invite refused, unavailable code, invalid code 404, already-paired guest refused, invite refused when active, and the migration ordering        |
| `PairFormationIT` (6 cases)    | integration | P-1 end to end, the pair going `ACTIVE` with both members and the composed name, single-use codes, self-join, the public preview, and the second invite refusal  |
| `LeavePairIT` (5 cases)        | integration | R-11 to R-13: both people come out alone with different codes, pairing again afterwards works, what each logged follows them, 422 with no partner, 401 anonymous |
| `PairPage.test.tsx` (9 cases)  | component   | The join form, and that ending asks first, sends nothing when the person backs out, returns to the invite screen, and keeps the pair on screen when it fails     |
| `TenantIsolationIT` (30 cases) | integration | That the tenant boundary the pair defines actually holds on every endpoint                                                                                       |
| `AuthFlowIT`                   | integration | R-1: registration produces the pair                                                                                                                              |

```bash
./mvnw test -Dtest=PairServiceTest
./mvnw verify -Dit.test=PairFormationIT
./mvnw verify -Dit.test=LeavePairIT
npm --prefix frontend test -- src/features/pair
```

**Proved non-vacuous** (2026-09-08). Leaving the partner behind in the ended pair
fails `leavingEndsThePairAndGivesBothPeopleAFreshInviteCode`. Skipping the data
migration fails `whatEachPersonLoggedFollowsThem`, but only after that test was
rewritten: the first version read the meal list, which is queried by user id and
stays visible whether or not the row moved, so it passed with the migration
disabled. It now reads the feed, which is queried by tenant. On the frontend,
ending without the confirmation step fails all four leaving tests and none of the
five join ones.

### What is not covered

- **Two people accepting the same invite at the same instant.** The check and the write are
  not in one atomic statement, and `pairs` has no constraint that would stop a second
  `user2_id` being written. `PairFormationIT.anInviteCodeCannotBeUsedTwice` covers the
  sequential case only. This is the most likely remaining defect in the feature.
- **A guest carrying every kind of data.** The integration test moves one meal. The other
  eight tables are covered by the adapter listing them, not by a test that writes to each.
- **The `PAUSED` status.** It exists in the schema and in `PairStatus` and no code path ever
  sets it.
- **Two people leaving at the same instant.** Both would read the pair as `ACTIVE` and both
  would mint fresh tenants. The second write is idempotent in effect, but no test proves it.
- **What the partner is told.** `PairEndedEvent` is published and nothing listens to it yet,
  so the person who did not ask finds out by opening the app. A notification is the obvious
  listener and is not written.
- **The ended pair's history is unreachable.** The seasons and the ledger survive by design,
  but no screen reads them any more: both people are scoped to their new tenants. The rows
  are preserved for the record, not yet shown.
- **A partial failure during the move.** The whole join is one transaction, so a failure
  should roll everything back, but no test kills it halfway.
- **`updateRelationshipType`.** No test at all, in either suite.

## How to verify in production

```sql
-- read only: pairs by status
SELECT status, count(*) FROM pairs GROUP BY status;

-- read only: a row whose tenant does not match its user means the move in R-2 missed a table
SELECT 'food_logs' AS t, count(*) FROM food_logs f JOIN users u ON u.id = f.user_id WHERE f.tenant_id <> u.tenant_id
UNION ALL SELECT 'activity_logs', count(*) FROM activity_logs a JOIN users u ON u.id = a.user_id WHERE a.tenant_id <> u.tenant_id
UNION ALL SELECT 'feed_items', count(*) FROM feed_items fi JOIN users u ON u.id = fi.user_id WHERE fi.tenant_id <> u.tenant_id
UNION ALL SELECT 'point_events', count(*) FROM point_events p JOIN users u ON u.id = p.user_id WHERE p.tenant_id <> u.tenant_id;

-- read only: notifications has no FK to pairs, so orphans there are silent
SELECT count(*) FROM notifications n LEFT JOIN pairs p ON p.id = n.tenant_id WHERE p.id IS NULL;

-- read only: an ACTIVE pair missing a member would be a bug in joining
SELECT count(*) FROM pairs WHERE status = 'ACTIVE' AND (user1_id IS NULL OR user2_id IS NULL);

-- read only: an ENDED pair still holding a member means leaving stopped halfway
SELECT count(*) FROM pairs WHERE status = 'ENDED' AND (user1_id IS NOT NULL OR user2_id IS NOT NULL);

-- read only: nobody's tenant should be an ended pair
SELECT count(*) FROM users u JOIN pairs p ON p.id = u.tenant_id WHERE p.status = 'ENDED';

-- read only: what the ended pairs are keeping, which is the point of not deleting them
SELECT (SELECT count(*) FROM seasons s JOIN pairs p ON p.id = s.tenant_id WHERE p.status = 'ENDED') AS seasons,
       (SELECT count(*) FROM point_events e JOIN pairs p ON p.id = e.tenant_id WHERE p.status = 'ENDED') AS ledger_rows;
```

## Known debt

| Item                                                     | Impact                                                         | When it is meant to be addressed                                                                                                              |
| -------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| No test for two people accepting one invite concurrently | The single-use rule is only proved sequentially                | Next change to this feature                                                                                                                   |
| `TenantDataMigrationAdapter` lists tables by hand        | A new table with `tenant_id` and `user_id` must be added there | Mitigated: forgetting makes `PairFormationIT` fail on the foreign key rather than stranding data silently. The comment in the adapter says so |
| P-3, membership never asserted                           | Latent, unreachable today                                      | Backlog                                                                                                                                       |
| The partner is not told the pair ended                   | They find out by opening the app and seeing the invite screen  | `PairEndedEvent` is published for exactly this; a notification listener is the next step                                                      |
| An ended pair's seasons are kept but shown nowhere       | The record survives and no screen reads it                     | A "past pairs" view, if the product wants one. The rows are preserved either way                                                              |
| `point_events` still points at the person who left       | Correct today; becomes the account-deletion problem            | Account deletion anonymises those rows instead of removing them, for the reason in R-12                                                       |

## History

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Pull request                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 2026-09-06 | P-1 fixed: tenant data follows the guest on join. Document created                                                                                                                                                                                                                                                                                                                                                                                                                              | #32                                 |
| 2026-09-08 | join form on react-hook-form + zod, mirroring the 8-character alphabet of `AuthService.generateInviteCode`; a blank or malformed code no longer reaches the server, and the generic "Erro de validação" is filtered through `getApiErrorMessage`. The placeholder `VITA-0000` (a shape no code ever has) became `ABCD2345`. First 5 component tests                                                                                                                                             | `refactor/frontend-forms-and-tests` |
| 2026-09-08 | A pair can end. `DELETE /pair/membership` moves both people into fresh pending tenants with what they logged, and marks the old pair `ENDED` (`V25`) so its seasons, scores and ledger survive: the season history is summed from the ledger on every read, so deleting those rows would have rewritten who won. R-6 stops being permanent. `InviteCode` moved out of `AuthService`, which minted codes for a different feature's domain. `PairEndedEvent` is published and nothing listens yet | `feat/leave-pair`                   |
