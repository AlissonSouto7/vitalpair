# Feature: premium (the paid plan)

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped; nobody can buy it yet
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-11

## What it is and where it lives

The AI features (the weekly meal plan, the daily workout, the meal photo) belong
to a paid plan. Nobody has paid yet, and there is no way to pay: the plan is a
column that billing will write one day, and two test accounts hold it for life.
Until then, every account is FREE and the AI features are visible but closed, with
a notice saying they are part of the paid plan.

|                   |                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Frontend route    | none of its own; the notice renders inside `/meal-plan`, `/workout-plan` and the photo tab of `/nutrition` |
| Who can access it | any signed-in user reads their own entitlement                                                             |
| Backend package   | `com.aps.vitalpair.entitlement`, with the plan itself on `user`                                            |
| Feature flag      | none; `users.plan` is the switch                                                                           |

## Architecture

| Layer         | Files                                                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route         | `entitlement/infrastructure/web/EntitlementController.java`                                                                                              |
| Use case port | `entitlement/domain/port/in/AiEntitlementUseCase.java`                                                                                                   |
| Service       | `entitlement/application/service/AiEntitlementService.java`, with a `Clock` (`config/ClockConfig.java`, new)                                             |
| Exception     | `entitlement/domain/exception/AiAccessRequiredException.java` → 402 in `EntitlementExceptionHandler`                                                     |
| Data          | `user/domain/model/Plan.java`; `User.plan`, `User.planExpiresAt`, `User.hasPremium(Instant)`; `UserJpaEntity` columns `plan`, `plan_expires_at`          |
| Guarded       | `ai/application/service/MealPlanService` (`generate`, `swap`), `WorkoutPlanService.generate`, `mealvision/application/service/MealVisionService.analyze` |
| Frontend      | `src/api/entitlement.ts`, `src/features/premium/{queries.ts,PremiumCallout.tsx}`, `src/locales/premium.ts`; read by the three AI screens                 |

The feature is its own package because the answer depends on `user` (the plan)
and `pair` (the partner), and `ai` and `mealvision` must not reach into either.
It imports the two features' published output ports and exposes one input port;
nothing imports it back, so no cycle joins the six the ArchUnit rule freezes.

### Endpoints

| Method | Path                      | Action                              | Who can call it |
| ------ | ------------------------- | ----------------------------------- | --------------- |
| GET    | `/api/v1/entitlements/me` | `{ plan, aiAccess }` for the caller | signed-in user  |

And the four that now answer **402** without a plan: `POST /api/v1/meal-plan/generate`,
`POST /api/v1/meal-plan/swap`, `POST /api/v1/workout-plan/generate`,
`POST /api/v1/nutrition/photo`. Reading an existing plan, ticking exercises and
finishing a workout stay open: they cost nothing and belong to the person.

### Data

| Table   | Created in | Notes                                                                                                     |
| ------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `users` | V28        | `plan VARCHAR(20) NOT NULL DEFAULT 'FREE'`, `plan_expires_at TIMESTAMPTZ NULL`; additive, expand/contract |

## Business rules

| #   | Rule                                                                               | Why                                                                                                                                                                                              |
| --- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P-1 | The plan belongs to the person who pays, and follows them out of a pair            | Decided 2026-09-11 ("option A"): someone who paid and ends a pair keeps what they bought                                                                                                         |
| P-2 | While the pair is active, the partner has the same access                          | A pair is the product's unit; one plan covers both people for as long as they are a pair                                                                                                         |
| P-3 | A pair that is PENDING or ENDED lends nothing                                      | Pending has no partner; ended is over. The borrowed access disappears the moment the pair does                                                                                                   |
| P-4 | PREMIUM with no expiry is a lifetime plan; an expiry exactly now counts as expired | The two test accounts are lifetime; a subscription will write an expiry. `hasPremium` compares against the injected clock                                                                        |
| P-5 | The check runs before validation and before any paid call                          | A person without the plan hears about the plan, not about a missing calorie target, and the model is never called on their behalf                                                                |
| P-6 | The refusal is 402, with the reason in the message                                 | 403 reads as "forbidden" and 503 as "try later"; neither is true. The message is in Portuguese, like every other user-facing backend message                                                     |
| P-7 | The interface decides from the entitlement, not from a refused request             | The screens read `/entitlements/me` and show the notice; a free account never sees a button that would only answer 402. Unknown (loading, error) is treated as open, and the server then decides |
| P-8 | Ending or forming a pair invalidates the cached entitlement                        | `PairPage` invalidates the `['entitlement']` query when the pair changes, because that is exactly when the borrowed access appears or disappears                                                 |

## Security findings

### Verified and fine

| Check                                        | How it was verified                                                                                                                      | Date       |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| The plan cannot be set through the API       | `plan` and `plan_expires_at` are on no request record; `UpdateProfileRequest` is unchanged. Only SQL on the machine writes them today    | 2026-09-11 |
| The entitlement read is scoped to the caller | `entitlementOf(principal.userId())`; `TenantIsolationIT` lists `/api/v1/entitlements/me` among the reads that never leak the other pair  | 2026-09-11 |
| The partner lookup cannot be steered         | The pair is found by the caller's own `tenantId`, never by an id from the request                                                        | 2026-09-11 |
| No paid call happens for a free account      | `AiGateIT` gets 402 from all four endpoints with WireMock recording nothing; `MealVisionService` checks before the image is even decoded | 2026-09-11 |
| Rate limits still apply in front of the gate | The limiter is a servlet filter; `RateLimitIT` runs with premium accounts and still sees 429 at the cap                                  | 2026-09-11 |

### Open

| ID  | Severity | File      | What happens                                                                                     | Measured impact                         | Why it is still open                                                                                                                                           |
| --- | -------- | --------- | ------------------------------------------------------------------------------------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-9 | Info     | (no file) | Granting a plan is a SQL statement on the machine; there is no admin endpoint and no audit trail | Two accounts, by hand, documented below | Billing does not exist. The day it does, it writes the columns and logs who paid; an admin endpoint before that would be an endpoint with no product behind it |

## Tests

| Test                                                        | Type        | Risk it covers                                                                                                                                                                                                          |
| ----------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AiEntitlementServiceTest` (11)                             | unit        | Every branch of P-1 to P-4 with a fixed clock: free alone, premium, expired, expiring now, partner active, partner ended, partner pending, partner expired, and `require` both ways                                     |
| `AiGateIT` (5)                                              | integration | A new account is FREE with no access; all four endpoints answer 402 with the reason; a premium account gets past the door; a partner borrows and loses it when the pair ends while the payer keeps it; anonymous is 401 |
| `TenantIsolationIT`                                         | integration | `/api/v1/entitlements/me` never shows the other pair                                                                                                                                                                    |
| `MealPlanPage.test.tsx` (2), `WorkoutPlanPage.test.tsx` (2) | component   | The notice instead of the generate button for a free account; the button and no notice with access                                                                                                                      |
| `NutritionPage.test.tsx` (+2)                               | component   | The photo tab shows the notice instead of the camera, and the camera with access                                                                                                                                        |

```bash
./mvnw test -Dtest=AiEntitlementServiceTest
./mvnw verify -Dit.test=AiGateIT
npm --prefix frontend test -- premium mealplan workoutplan nutrition
```

Every integration test that reaches an AI feature now calls `grantPremium(session)`
from `AbstractIntegrationTest`, which writes the column directly: there is no
endpoint for it on purpose.

### What is not covered

- **A plan that expires while the person is on the screen.** The entitlement is
  cached for five minutes; the server still refuses, and the screen shows the
  refusal's message.
- **A partner's plan expiring**, as opposed to the pair ending: covered in the unit
  test, not through HTTP.
- **The notice's copy in three languages** is checked for parity, not for meaning.

## How to verify in production

```sql
-- read only: who has a plan, and until when
SELECT email, plan, plan_expires_at FROM users WHERE plan <> 'FREE' AND deleted_at IS NULL;

-- read only: refusals in the last day, from the access log of the edge (402 on the AI routes)
-- docker logs vitalpair-edge-nginx-1 2>&1 | grep -E '"POST /api/v1/(meal-plan|workout-plan|nutrition/photo)' | grep ' 402 '
```

Granting a lifetime plan, until billing exists (on the machine, as the operator):

```sql
UPDATE users SET plan = 'PREMIUM', plan_expires_at = NULL WHERE email = 'someone@example.com';
```

## Known debt

| Item                                    | Impact                                           | When it is meant to be addressed        |
| --------------------------------------- | ------------------------------------------------ | --------------------------------------- |
| No way to buy the plan                  | The notice says "not on sale yet", and it is not | Billing, after the launch               |
| P-9, grants by SQL                      | No audit trail of who was given what             | With billing                            |
| The key on staging is a development key | Staging spends the owner's own Anthropic credit  | It is rotated when production is set up |

## History

| Date       | Change                                                                                                                                                                                                                                                                                                             | Pull request           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| 2026-09-11 | Created: the plan on the user (V28), the entitlement feature, the four endpoints behind 402, the notice in the three screens, and the rule that the plan follows the payer and is shared while the pair lasts                                                                                                      | #95                    |
| 2026-09-11 | Live on staging: V28 applied, the two test accounts granted a lifetime plan, the Anthropic key put on the server. Proved from outside: a free account gets 402 on all three AI endpoints, a premium account generated a real workout in 15s, and the notice renders on the three screens for the free account only | `docs/deploy-findings` |
