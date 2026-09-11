# Feature: user profile and TDEE

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-08

## What it is and where it lives

Who the person is and what their day should look like in calories. Height,
weight, birth date, sex, activity level and goal go in; a basal metabolic rate, a
total daily expenditure, a calorie target and a macro split come out.

The arithmetic lives in its own package, `tdee`, which has no controller, no
table and no port to the outside. It is a calculator that `user` calls.

|                   |                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| Frontend routes   | `/profile`, `/onboarding`, `/settings`                                                            |
| Who can access it | authenticated user, their own profile only                                                        |
| Backend packages  | `com.aps.vitalpair.user` (19 classes, 612 lines), `com.aps.vitalpair.tdee` (5 classes, 127 lines) |
| Feature flag      | none                                                                                              |

## Architecture

| Layer           | Files                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| Controller      | `user/infrastructure/web/UserController.java`                                                         |
| Use case ports  | `GetProfileUseCase`, `UpdateProfileUseCase`, `GetTdeeUseCase`, and `tdee`'s `CalculateTargetsUseCase` |
| Services        | `user/application/service/UserProfileService.java`, `tdee/application/service/TdeeService.java`       |
| Output ports    | `UserRepositoryPort`, plus `progress`'s `RecordWeightUseCase`                                         |
| Persistence     | `UserJpaEntity`, `UserJpaRepository`, `UserPersistenceAdapter`, `UserPersistenceMapper`               |
| Frontend pages  | `ProfilePage.tsx`, `OnboardingPage.tsx`, `SettingsPage.tsx`                                           |
| i18n namespaces | `profile`, `onboarding`, `settings`                                                                   |

### Endpoints

| Method | Path                    | Action                                                          |
| ------ | ----------------------- | --------------------------------------------------------------- |
| GET    | `/api/v1/users/me`      | The caller's profile                                            |
| PUT    | `/api/v1/users/me`      | Replace the profile and recompute the targets                   |
| GET    | `/api/v1/users/me/tdee` | BMR, TDEE, calorie target and macros, recomputed live           |
| DELETE | `/api/v1/users/me`      | Close the account. See [account-closure.md](account-closure.md) |

All of them take the id from the authenticated principal. There is no
`/users/{id}`, so there is no object-level authorization question to answer.

### The formulas

BMR is **Mifflin-St Jeor**:

```
BMR = 10 × weightKg + 6.25 × heightCm − 5 × age + sexConstant
sexConstant: MALE +5, FEMALE −161, OTHER −78
```

`OTHER` is the exact mean of the other two, which is the least wrong answer
available when the equation only has two forms.

```
TDEE = BMR × activityMultiplier
  SEDENTARY 1.2, LIGHT 1.375, MODERATE 1.55, ACTIVE 1.725, VERY_ACTIVE 1.9

target = TDEE + goalAdjustment
  LOSE_WEIGHT −500, GAIN_MUSCLE +300, MAINTAIN 0, IMPROVE_FITNESS 0
```

Macros are **not** a percentage split. Protein and fat are grams per kilogram of
body weight, and carbohydrate is whatever calories are left:

```
proteinG = weight × (LOSE_WEIGHT 2.0 | GAIN_MUSCLE 2.2 | otherwise 1.8)
fatG     = weight × (LOSE_WEIGHT 0.8 | GAIN_MUSCLE 1.0 | otherwise 0.9)
carbG    = max(0, (target − proteinG×4 − fatG×9) / 4)
```

### Data

| Table                  | Created in                     | Notes                                                                       |
| ---------------------- | ------------------------------ | --------------------------------------------------------------------------- |
| `users`                | `V1__init_users_and_pairs.sql` | Profile columns are all nullable: an account exists before its profile does |
| `users.email_verified` | `V11`                          |                                                                             |
| `users.role`           | `V23`                          | `CHECK IN ('USER','ADMIN')`                                                 |

`tdee` owns nothing.

## Business rules

| #   | Rule                                                                                                                      | Why                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1 | The calorie target and the four macro targets are computed by the server on every profile update; no request can set them | A client that chooses its own budget makes the whole calculation decorative. Proved by `ProfileUpdateIT.aClientCannotChooseItsOwnCalorieTarget` |
| R-2 | `GET /me/tdee` refuses an incomplete profile with a 422 naming what is missing                                            | Returning a number computed from nulls would be worse than refusing                                                                             |
| R-3 | `GET /dashboard` and `/progress` do **not** refuse an incomplete profile; they return null targets                        | The dashboard is the first screen after signing up. Refusing it would lock a new user out of their own app                                      |
| R-4 | Updating the weight in the profile writes a point into the weight history                                                 | Otherwise the chart on the progress screen disagrees with the profile                                                                           |
| R-5 | Role, tenant, e-mail, password hash and the targets are absent from the request record                                    | Not a filter that has to be maintained: they have nowhere to bind. See U-1                                                                      |
| R-6 | There is no endpoint that changes a role                                                                                  | An API that grants admin is an escalation path. Promotion is a manual `UPDATE`                                                                  |
| R-7 | `avatarUrl` must be an `https` URL                                                                                        | See U-2                                                                                                                                         |
| R-8 | Height is bounded to 50..300 cm and weight to 20..500 kg                                                                  | The formulas produce nonsense outside human range, and the column is `NUMERIC(5,2)`                                                             |

## Security findings

### Fixed

| ID  | Severity | File                   | What happened                                                                                                                                                                                                                                                                                                                                       | Measured impact                                                                           | Fix                                                                                                                                                                                                                                  |
| --- | -------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| U-2 | Medium   | `UpdateProfileRequest` | `avatarUrl` was validated only by `@Size(max = 500)`. It is rendered as the `src` of an `<img>` **in the partner's browser** (`PairPage.tsx` → `Avatar.tsx`), so whoever set it chose an address the partner's browser would fetch: an ordinary tracking URL returns the partner's IP and user agent to its owner on every visit to the pair screen | Reachable by any user against their own partner. Not exploited, since nothing is deployed | `@Pattern` accepting only `https://` with no whitespace or quote characters. `ProfileUpdateIT.anAvatarThatIsNotAnHttpsUrlIsRejected` covers five payloads. Proved non-vacuous: without the annotation all five are accepted with 200 |

### Open

| ID  | Severity | File                         | What happens                                                                                                                                                                                                                                                                                                                                                   | Measured impact                                                                   | Why it is still open                                                                                                                                       |
| --- | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U-3 | Low      | `TdeeService`                | Carbohydrate uses integer division, so up to 3 kcal vanish per calculation. Measured on the exact case in `TdeeServiceTest.mulherPerdaDePeso`: 430 remaining kcal becomes 107 g, and the macros then sum to 1416 against a target of 1418                                                                                                                      | 2 kcal on a 1418 kcal target, which no user can perceive                          | Real but immaterial. Fixing it means changing a formula whose current output is pinned by tests, for a rounding nobody sees                                |
| U-4 | Low      | `TdeeService`                | When protein and fat alone exceed the calorie target, `max(0, ...)` clamps carbohydrate to zero and the prescription becomes internally contradictory: the target says one number, the macros sum to a larger one. Constructed a real case: 45 kg, 150 cm, 60 years, sedentary, losing weight gives a 612 kcal target while protein and fat alone are 684 kcal | Only reachable at the extreme low end of the input range. No user has produced it | The right fix is to refuse the combination or scale the grams down, which is a product decision about what to tell that person                             |
| U-5 | Low      | `UserProfileService`         | `PUT` is a full replacement, so omitting `avatarUrl` clears it. Every other field is `@NotNull`, so this is the only one it can happen to                                                                                                                                                                                                                      | A client that sends a partial body loses the avatar                               | Documented rather than changed: making one field behave differently from the rest is worse than the current consistency. A `PATCH` would be the honest fix |
| U-6 | Low      | `UserRepositoryPort#findAll` | Returns every user in the installation with no filter. Used only by the notification schedulers                                                                                                                                                                                                                                                                | Not reachable from any endpoint. It is a loaded gun on a shared port              | The schedulers genuinely need every user; the fix is pagination, recorded in [notifications.md](notifications.md) as N-1                                   |

### Verified and fine

| Check                                              | How it was verified                                                                                                                                                                                                                                                                                               | Date       |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| No mass assignment                                 | `UpdateProfileRequest` has exactly eight fields; `role`, `tenantId`, `email`, `passwordHash` and the targets are not among them, so Jackson has nowhere to bind them. The controller copies field by field. `ProfileUpdateIT.aClientCannotChooseItsOwnCalorieTarget` sends all three and asserts none took effect | 2026-09-06 |
| The password hash never leaves the server          | `UserProfileResponse` omits it; asserted in `ProfileUpdateIT`                                                                                                                                                                                                                                                     | 2026-09-06 |
| A user cannot change their own e-mail or role here | Neither field exists on the request, and there is no e-mail-change endpoint anywhere                                                                                                                                                                                                                              | 2026-09-06 |
| Server-side validation of every profile field      | `ProfileUpdateIT` covers an impossible weight and a future birth date                                                                                                                                                                                                                                             | 2026-09-06 |
| No IDOR                                            | All three endpoints read the id from the principal; there is no `/users/{id}`                                                                                                                                                                                                                                     | 2026-09-06 |

## Tests

| Test                                | Type        | Risk it covers                                                                                                                                                                                                                                                 |
| ----------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TdeeServiceTest` (3 cases)         | unit        | The male bulking case, the female cutting case, and that `MAINTAIN` does not adjust                                                                                                                                                                            |
| `UserProfileServiceTest` (3 cases)  | unit        | Targets written on update, 422 on an incomplete profile, 404 for an unknown user                                                                                                                                                                               |
| `ProfileUpdateIT` (11 cases)        | integration | R-1, R-5, U-2 with five payloads, the bounds on weight and birth date, and that both endpoints need authentication                                                                                                                                             |
| `OnboardingPage.test.tsx` (5 cases) | component   | The first write of the profile: each missing or out-of-range field refused with its own message, nothing sent without the activity level, values kept when stepping back, and the PUT body with numbers as numbers and the date assembled from three dropdowns |

```bash
./mvnw test -Dtest='TdeeServiceTest,UserProfileServiceTest'
./mvnw verify -Dit.test=ProfileUpdateIT
```

### What is not covered

- **`Sex.OTHER` and `Goal.IMPROVE_FITNESS`** have no test, and neither do three of the five
  activity multipliers. These are exactly the branches where a wrong constant would go
  unnoticed.
- **U-4**, the impossible macro budget, has no test.
- **R-4**: `UserProfileServiceTest` mocks the weight recorder and never verifies it was
  called, so the profile-to-history link is unasserted.
- **Age at a birthday boundary** is untested; `ageFrom` uses the server's clock with no
  injected `Clock`.

## How to verify in production

```sql
-- read only: profiles complete enough to have a target
SELECT count(*) FILTER (WHERE daily_calorie_target IS NOT NULL) AS with_target, count(*) AS total FROM users;

-- read only: a target far outside human range would mean the formula broke
SELECT count(*) FROM users WHERE daily_calorie_target IS NOT NULL
  AND (daily_calorie_target < 800 OR daily_calorie_target > 6000);

-- read only: U-2 regressing, or rows written before the rule existed
SELECT count(*) FROM users WHERE avatar_url IS NOT NULL AND avatar_url NOT LIKE 'https://%';

-- read only: nobody was granted admin unexpectedly
SELECT email, role FROM users WHERE role <> 'USER';
```

## Known debt

| Item                                    | Impact                                                                 | When it is meant to be addressed                                            |
| --------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| U-3 and U-4, the macro arithmetic       | Immaterial rounding; a contradictory prescription at the extreme       | Together, when the calculation is next revisited                            |
| U-5, PUT clears an omitted avatar       | Surprising for a partial update                                        | A `PATCH` endpoint                                                          |
| Untested enum branches in `TdeeService` | A wrong constant would ship                                            | Cheap to add; worth doing next time the file is touched                     |
| Existing avatar rows are not backfilled | Any pre-existing non-https value stays until the profile is next saved | The query above finds them; there are none today, since nothing is deployed |

## History

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                             | Pull request                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| 2026-09-06 | U-2 fixed, first HTTP-level tests for the profile, document created (phase 13)                                                                                                                                                                                                                                                                                                                                     | `docs/professional-docs`            |
| 2026-09-08 | Phase 10a: the edit form on react-hook-form + zod, mirroring `UpdateProfileRequest` field by field; each missing or out-of-range field gets its own message next to it, replacing one banner for "sex and activity level". The weight card uses the shared `WeightForm`, which fixed a save with no `catch`. First 6 component tests                                                                               | `refactor/frontend-forms-and-tests` |
| 2026-09-09 | Onboarding step 1 on react-hook-form + zod, on the profile's own schema (`profileSchema`, which the edit form extends), so the first form and the later edit cannot disagree about a valid profile. Each field gets its own message in four languages; the "fill in everything" banner stays as the summary. Steps 1 and 2 are one form held by the page, so stepping back keeps what was typed. 5 component tests | `feat/onboarding-form`              |
| 2026-09-11 | `users.plan` and `users.plan_expires_at` (V28), `Plan` enum and `User.hasPremium(Instant)`. Not on any request record: only billing, one day, or SQL on the machine writes them. The rule that reads them lives in [premium.md](premium.md)                                                                                                                                                                        | `feat/ai-paid-plan`                 |
