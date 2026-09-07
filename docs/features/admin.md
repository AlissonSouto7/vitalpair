# Feature: admin

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-06

## What it is and where it lives

One endpoint returning six counts: how many accounts exist, how many confirmed
their address, how many pairs exist, how many are active, and how many meals and
activities have been logged in total.

It is deliberately small. The point of it is not the numbers: it is that the
application has a second role and a real endpoint behind it, so authorisation is
something the codebase actually does rather than something it claims it could.

|                   |                                               |
| ----------------- | --------------------------------------------- |
| Frontend route    | none; it is an operational endpoint           |
| Who can access it | `ADMIN` only                                  |
| Backend package   | `com.aps.vitalpair.admin` (1 class, 58 lines) |
| Feature flag      | none                                          |

## Architecture

One class, `admin/infrastructure/web/AdminStatsController.java`, holding
`@PreAuthorize("hasRole('ADMIN')")` and six `JdbcTemplate` counts. There is no
service, no port and no table, because there is no domain logic: the endpoint is
a window onto the database, and inventing three layers to say so would be
ceremony.

### Endpoints

| Method | Path                  | Action                       | Who can call it |
| ------ | --------------------- | ---------------------------- | --------------- |
| GET    | `/api/v1/admin/stats` | Six installation-wide counts | `ADMIN`         |

### Data

None owned. It reads `users`, `pairs`, `food_logs` and `activity_logs`.

## Business rules

| #   | Rule                                                                                            | Why                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| R-1 | Counts only, never rows                                                                         | An operational metric needs a total; it does not need anybody's e-mail. Nothing here can return a name, an address or an id      |
| R-2 | Counts span the whole installation, not one tenant                                              | The number is about the deployment, not about a pair. Explicit in the code so it is not read as a missing filter                 |
| R-3 | The role is checked twice: by `@PreAuthorize` and by the chain's `anyRequest().authenticated()` | Method security is a single annotation away from being silently off, which is exactly the failure the test below exists to catch |
| R-4 | There is no endpoint that grants `ADMIN`                                                        | Promotion is a manual `UPDATE users SET role = 'ADMIN'`. An API that grants admin is an escalation path                          |

## Security findings

### Verified and fine

| Check                                           | How it was verified                                                                                                                                                                                                                     | Date       |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| A plain user is refused                         | `AdminStatsControllerTest.deniesAPlainUser` asserts 403 with a `USER` principal                                                                                                                                                         | 2026-09-06 |
| An anonymous caller is refused                  | `AdminStatsControllerTest.deniesAnAnonymousCaller` asserts 401                                                                                                                                                                          | 2026-09-06 |
| An admin is allowed                             | `AdminStatsControllerTest.allowsAnAdmin` asserts 200 and the payload                                                                                                                                                                    | 2026-09-06 |
| Method security is genuinely active in the test | `@WebMvcTest` does not load `SecurityConfig`, so `@EnableMethodSecurity` is re-declared in the test's own config. Without that every assertion would pass regardless of role, which is the false confidence the class exists to prevent | 2026-09-06 |
| No per-user data can leak                       | Every query is `count(*)`; no column but a count is ever selected. Read in full                                                                                                                                                         | 2026-09-06 |
| No injection surface                            | The six SQL strings are compile-time constants; no input reaches them                                                                                                                                                                   | 2026-09-06 |
| No escalation path                              | No endpoint writes `users.role`, and `role` is not bindable through the profile update. Confirmed by grep and by `ProfileUpdateIT.aClientCannotChooseItsOwnCalorieTarget`, which sends `role: ADMIN` and asserts it does not appear     | 2026-09-06 |

### Open

| ID   | Severity      | File                   | What happens                                                                                  | Measured impact                                                                                                                  | Why it is still open                                                                                  |
| ---- | ------------- | ---------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| AD-1 | Informational | `AdminStatsController` | An `ADMIN` belongs to a tenant and sees counts spanning every tenant                          | Correct for an operator of a two-person product. It would be a business-data leak in a multi-tenant SaaS with third-party admins | Documented as intent. It is the thing to revisit before anyone outside the owner is ever made `ADMIN` |
| AD-2 | Informational | `AdminStatsController` | The six counts are six round trips with no transaction, so they are not a consistent snapshot | Two numbers can disagree by a row under concurrent writes                                                                        | Cosmetic for a stats endpoint                                                                         |

## Tests

| Test                                 | Type  | Risk it covers                                               |
| ------------------------------------ | ----- | ------------------------------------------------------------ |
| `AdminStatsControllerTest` (3 cases) | slice | R-3: that the role is actually enforced, at 401, 403 and 200 |

```bash
./mvnw test -Dtest=AdminStatsControllerTest
```

### What is not covered

- **Five of the six counters.** All six queries are stubbed to return the same value, so
  only `users` is asserted; swapping two SQL strings by mistake would not be caught.
- **The null fallback** when a count returns nothing.

## How to verify in production

```sql
-- read only: the same six numbers the endpoint returns
SELECT
  (SELECT count(*) FROM users) AS users,
  (SELECT count(*) FROM users WHERE email_verified) AS verified,
  (SELECT count(*) FROM pairs) AS pairs,
  (SELECT count(*) FROM pairs WHERE status = 'ACTIVE') AS active_pairs,
  (SELECT count(*) FROM food_logs) AS meals,
  (SELECT count(*) FROM activity_logs) AS activities;

-- read only: R-4, who is an admin
SELECT email, role FROM users WHERE role = 'ADMIN';
```

Promotion, when it is needed:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

## Known debt

| Item                                 | Impact                                             | When it is meant to be addressed       |
| ------------------------------------ | -------------------------------------------------- | -------------------------------------- |
| Only one of six counters is asserted | A copy-paste error in the SQL would ship           | Cheap; next change here                |
| AD-1, installation-wide counts       | Correct now, wrong under a real multi-tenant model | Before any third party is made `ADMIN` |

## History

| Date       | Change                                             | Pull request             |
| ---------- | -------------------------------------------------- | ------------------------ |
| 2026-09-05 | Roles, method security and this endpoint (phase 6) | `feat/auth-hardening`    |
| 2026-09-06 | Document created (phase 13)                        | `docs/professional-docs` |
