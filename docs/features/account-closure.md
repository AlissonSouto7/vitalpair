# Feature: account closure

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-08

## What it is and where it lives

Closing an account and erasing what the person recorded. Article 18 III of the
LGPD gives them the right to ask for it, and until this shipped the privacy
policy told them in four places that they could close their account in settings
while no such control and no such endpoint existed.

It has its own document rather than a section inside `user-profile.md` because it
reaches across three packages, `user`, `pair` and `auth`, and is the
implementation the privacy policy points at.

|                   |                                                  |
| ----------------- | ------------------------------------------------ |
| Frontend route    | `/settings`                                      |
| Who can access it | the signed-in person, for their own account only |
| Backend packages  | `user` (service, port, adapter), `pair`, `auth`  |
| Feature flag      | none                                             |

## Architecture

| Layer          | Files                                                             |
| -------------- | ----------------------------------------------------------------- |
| Controller     | `user/infrastructure/web/UserController.java` (`DELETE /me`)      |
| Use case port  | `user/domain/port/in/CloseAccountUseCase.java`                    |
| Service        | `user/application/service/AccountClosureService.java`             |
| Output port    | `user/domain/port/out/PersonalDataErasurePort.java`               |
| Adapter        | `user/infrastructure/persistence/PersonalDataErasureAdapter.java` |
| Reused         | `LeavePairUseCase`, `RefreshTokenStorePort#revokeAllForUser`      |
| Frontend       | `features/settings/CloseAccountCard.tsx`                          |
| i18n namespace | `settings`                                                        |

### Endpoint

| Method | Path               | Action                     | Who can call it |
| ------ | ------------------ | -------------------------- | --------------- |
| DELETE | `/api/v1/users/me` | Close the caller's account | authenticated   |

Answers `204 No Content`. The id comes from the authenticated principal, so there
is no path parameter to tamper with and no object-level authorization question.

## The three treatments

This is the design. It is not a cascade, and the distinction is the whole point.

### 1. Deleted: what the person recorded about themselves

`feed_reactions`, `feed_items`, `food_logs`, `activity_logs`, `weight_logs`,
`notification_preferences`, `notifications`, `meal_plans`, `workout_plans`.

The plans take their children with them through `ON DELETE CASCADE`
(`meal_plan_items`, `workout_days`, `workout_exercises`).

Order matters in one place: `feed_reactions` is deleted before `feed_items`. A
reaction points at an item with `ON DELETE CASCADE`, so deleting the items first
would take the **partner's** reactions to this person's posts along with them.
Deleting the departing person's own reactions first keeps that cascade to what it
is meant to remove. The partner's reactions to the departing person's posts do go,
and that is correct: a reaction exists on a post, so it has no meaning once the
post is gone. That is different from a score, which stands on its own.

### 2. Kept, with the identity stripped: what describes a competition

`point_events`, `competition_scores`, `seasons`, `user_badges`.

**The reason is measurable.** `SeasonService.buildHistory` does not read a stored
result: for every closed season it re-runs `sumByUser` over that past window and
recomputes the winner on the spot. Deleting the departing person's ledger rows
would not remove a record, it would rewrite the partner's: every past season shown
with a rival score of zero, and every season the partner lost turned into a win,
dinner included.

`competition_scores` cannot be deleted for a second reason: one row holds both
members' weekly scores in `user1_score` and `user2_score`. There is no half to
remove.

What is stripped is the naming: `competition_scores.winner_id` and
`seasons.winner_user_id` are set to null, and the rows point at a user row that
no longer identifies anyone. Article 12 of the LGPD treats anonymised data as no
longer personal data, which is what makes keeping it lawful and the partner's
history honest at the same time.

### 3. Overwritten: the person's identity on their own row

| Column                                                                                                                   | After                      |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| `email`                                                                                                                  | `<userId>@removed.invalid` |
| `name`                                                                                                                   | `Conta encerrada`          |
| `password_hash`, `birth_date`, `sex`, `height_cm`, `weight_kg`, `goal`, `activity_level`, the four targets, `avatar_url` | null                       |
| `email_verified`                                                                                                         | false                      |
| `deleted_at`                                                                                                             | now                        |

The address is **freed rather than blanked**. `users.email` is `NOT NULL UNIQUE`,
so leaving the old value would lock the person out of their own e-mail address
for good if they ever came back. `removed.invalid` is reserved by RFC 2606 and can
never be registered, and the user id makes each tombstone distinct so two closures
cannot collide on the unique index.

## Business rules

| #   | Rule                                                             | Why                                                                                                                                                                |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-1 | An active pair is ended first                                    | `users.tenant_id` is `NOT NULL`. Closing without leaving would strand the partner in a pair with a member who no longer exists and no way to invite anyone else    |
| R-2 | The user row survives as a tombstone                             | Thirteen foreign keys point at it, all `NO ACTION`, so it could not be deleted anyway. But it stays because of section 2 above, not because of the constraints     |
| R-3 | `deleted_at` is the marker, not the shape of the scrubbed e-mail | "The address looks scrubbed" is not a check anyone should write. `refresh` tests this column                                                                       |
| R-4 | Session refresh refuses a closed account                         | Closing revokes the sessions it knows about, but the JWT filter validates a signature and never reads the database. Without the check a stale token would renew    |
| R-5 | Closing twice is not an error                                    | The outcome the caller asked for is already true. Returns 204 and changes nothing                                                                                  |
| R-6 | Sessions are revoked last                                        | A failure earlier leaves the account usable rather than locked out of a closure that did not finish                                                                |
| R-7 | The browser makes the person type a word                         | This is the only action in the product that cannot be undone, and the button sits on a screen people open to change the theme. A word cannot be typed by a mis-tap |

## Security findings

### Fixed

| ID  | Severity | What happened                                                                                                                                                                                                                               | Fix                                                                                                                  |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| C-1 | High     | The privacy policy told users in four places that they could close their account in settings and that data would be removed within 30 days. No endpoint and no control existed. An LGPD article 18 III right documented but not implemented | This feature. The policy text still needs rewriting to describe what actually happens; that is the next pull request |

### Verified and fine

| Check                                                          | How                                                                                                                          | Date       |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Nobody can close someone else's account                        | The id comes from the principal; there is no `/users/{id}` variant. `closingRequiresBeingSignedIn` covers the anonymous case | 2026-09-08 |
| The partner keeps their own score after a closure              | `thePartnersSeasonHistoryIsUntouched` compares the stayer's score before and after                                           | 2026-09-08 |
| SQL is parameterised, table names are constants in the adapter | Read; nothing in the statements is built from input                                                                          | 2026-09-08 |
| The whole closure is one transaction                           | `@Transactional` on the service; a failure anywhere rolls back the erasure and the tombstone together                        | 2026-09-08 |

### Open

| ID  | Severity      | What happens                                                                                                                         | Why it is still open                                                                              |
| --- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| C-2 | Low           | An access token issued before the closure keeps working for up to fifteen minutes on endpoints that only check the signature         | Same trade as every revocation: a denylist costs a Redis read per request. `refresh` fails closed |
| C-3 | Low           | The partner is not told. They open the app and find themselves unpaired                                                              | `PairEndedEvent` is published by the leave step and still has no listener                         |
| C-4 | Informational | Closing is not rate limited                                                                                                          | It acts only on the caller's own account and is idempotent                                        |
| C-5 | Informational | There is no export before closure. LGPD article 18 II gives a right to portability, which is a separate right and a separate feature | Backlog                                                                                           |

## Tests

| Test                                  | Type        | Risk it covers                                                                                                                                                                                                                               |
| ------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AccountDeletionIT` (7 cases)         | integration | Personal rows deleted; the person unidentifiable; the partner's history intact and the ledger kept; the closed account cannot log in or refresh; the address freed for a new account; the partner left free to start over; anonymous refused |
| `CloseAccountCard.test.tsx` (7 cases) | component   | The first press does not close; what survives is stated before confirming; the typed word is required; the session is cleared on success; case-insensitive word; backing out sends nothing; the session survives a server error              |

```bash
./mvnw verify -Dit.test=AccountDeletionIT
npm --prefix frontend test -- src/features/settings
```

**Proved non-vacuous** (2026-09-08), three sabotages:

| Sabotage                                  | What failed                                                         |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `point_events` added to the deleted list  | `thePartnersSeasonHistoryIsUntouched`                               |
| The e-mail left in place instead of freed | `theAddressIsFreedForANewAccount`, `thePersonBecomesUnidentifiable` |
| The typed word not checked in the browser | `refuses to close until the word is typed`                          |

### What is not covered

- **A closure that fails halfway.** The whole thing is one transaction, so it
  should roll back, but no test kills it in the middle.
- **Two closures racing.** The second finds `deleted_at` set and returns, which is
  R-5, but the race itself is not tested.
- **The tombstone rendered on screen.** `Conta encerrada` is written into the row
  and no test opens a screen that would show it to the partner.
- **`user_badges` after closure.** Kept by design and asserted only indirectly,
  through the ledger count.
- **A closed account's rows in the tenant reports.** The pair the person left is
  `ENDED` and unreachable; nothing verifies what an operator querying it would see.

## How to verify in production

```sql
-- read only: closed accounts
SELECT count(*) FROM users WHERE deleted_at IS NOT NULL;

-- read only: a tombstone that still carries personal data is a bug in the closure
SELECT count(*) FROM users
WHERE deleted_at IS NOT NULL
  AND (password_hash IS NOT NULL OR birth_date IS NOT NULL OR weight_kg IS NOT NULL
       OR avatar_url IS NOT NULL OR email NOT LIKE '%@removed.invalid');

-- read only: personal rows that should have gone with the account
SELECT 'food_logs' AS t, count(*) FROM food_logs f JOIN users u ON u.id = f.user_id WHERE u.deleted_at IS NOT NULL
UNION ALL SELECT 'activity_logs', count(*) FROM activity_logs a JOIN users u ON u.id = a.user_id WHERE u.deleted_at IS NOT NULL
UNION ALL SELECT 'weight_logs', count(*) FROM weight_logs w JOIN users u ON u.id = w.user_id WHERE u.deleted_at IS NOT NULL
UNION ALL SELECT 'feed_items', count(*) FROM feed_items fi JOIN users u ON u.id = fi.user_id WHERE u.deleted_at IS NOT NULL;

-- read only: the ledger of a closed account SHOULD still be there. Zero here means
-- someone deleted history that belongs to the partner too.
SELECT count(*) FROM point_events p JOIN users u ON u.id = p.user_id WHERE u.deleted_at IS NOT NULL;

-- read only: a closed account still named as a winner would be a leak of identity
SELECT count(*) FROM seasons s JOIN users u ON u.id = s.winner_user_id WHERE u.deleted_at IS NOT NULL;
```

## Known debt

| Item                                             | Impact                                                              | When it is meant to be addressed                                        |
| ------------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| The privacy policy still describes the old story | It promises deletion in settings within 30 days, in different words | The next pull request, which rewrites the legal pages with real details |
| No export before closing                         | C-5, a separate LGPD right                                          | Backlog                                                                 |
| The partner is not notified                      | C-3                                                                 | Needs a `PairEndedEvent` listener                                       |
| No administrative closure                        | Only the account owner can close their own account                  | Nobody has asked for it                                                 |

## History

| Date       | Change                                                                                                                                                                                                                                 | Pull request            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 2026-09-08 | Feature created. `DELETE /users/me`, `V26` adding `users.deleted_at`, the three treatments, the typed-word gate in settings. Depends on leaving a pair (#43) and on revoking a user's sessions (#44), which is why those shipped first | `feat/account-deletion` |
