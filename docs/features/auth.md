# Feature: authentication

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-06

## What it is and where it lives

Everything that decides who is making a request: creating an account, signing in
with a password or with Google, keeping a session alive without asking for the
password again, signing out, and the two e-mail flows (confirming an address and
resetting a forgotten password).

Registering also creates the tenant. A pair is the unit of data ownership in
VitalPair, so a person who signs up alone gets a pair of one, in `PENDING`, with
an invite code their partner will later use. There is no state in which a user
exists without a tenant.

|                   |                                                                               |
| ----------------- | ----------------------------------------------------------------------------- |
| Frontend routes   | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` |
| Who can access it | anonymous; every endpoint in this feature is public                           |
| Backend package   | `com.aps.vitalpair.auth` (45 classes, 1,634 lines)                            |
| Feature flag      | none                                                                          |

## Architecture

| Layer             | Files                                                                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Controller        | `auth/infrastructure/web/AuthController.java`                                                                                                                                     |
| Use case ports    | `auth/domain/port/in/` (10 interfaces, one per use case)                                                                                                                          |
| Services          | `AuthService` (register, login, Google, refresh, logout), `PasswordResetService`, `EmailVerificationService`                                                                      |
| Output ports      | `TokenProviderPort`, `RefreshTokenStorePort`, `PasswordHasherPort`, `MailSenderPort`, `GoogleTokenVerifierPort`, `PasswordResetTokenStorePort`, `EmailVerificationTokenStorePort` |
| Token storage     | `RedisRefreshTokenStore`, `RedisPasswordResetTokenStore`, `RedisEmailVerificationTokenStore`                                                                                      |
| Security adapters | `JwtTokenProvider`, `JwtAuthenticationFilter`, `PasswordEncoderAdapter`, `GoogleTokenVerifier`                                                                                    |
| Cookie            | `auth/infrastructure/web/RefreshTokenCookie.java`                                                                                                                                 |
| Rate limiting     | `shared/ratelimit/RateLimitFilter.java` (policies for six auth routes)                                                                                                            |
| Frontend pages    | `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `VerifyEmailPage`                                                                                         |
| i18n namespace    | `auth`                                                                                                                                                                            |

### Endpoints

All under `/api/v1/auth`, all public, all rate limited.

| Method | Path                   | Action                                      | Limit               |
| ------ | ---------------------- | ------------------------------------------- | ------------------- |
| POST   | `/register`            | Create an account, its tenant and a session | 5/min per IP        |
| POST   | `/login`               | Exchange e-mail and password for a session  | 10/min per IP       |
| POST   | `/oauth2/google`       | Exchange a Google ID token for a session    | 10/min per IP       |
| POST   | `/refresh`             | Rotate the session from the cookie          | 30/min per IP       |
| POST   | `/logout`              | Revoke the token family, clear the cookie   | not limited         |
| POST   | `/forgot-password`     | Send a reset link                           | 3 per 10 min per IP |
| POST   | `/reset-password`      | Consume a reset token, set a new password   | not limited         |
| POST   | `/verify-email`        | Consume a verification token                | not limited         |
| POST   | `/resend-verification` | Send the verification e-mail again          | 3 per 10 min per IP |

### Data

| Table                  | Created in                     | Notes                                                                                             |
| ---------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------- |
| `users`                | `V1__init_users_and_pairs.sql` | `password_hash` is nullable: a Google account has no password                                     |
| `users.email_verified` | `V11__add_email_verified.sql`  | Existing rows backfilled to `true` so the migration did not lock anyone out                       |
| `users.role`           | `V23__add_user_role.sql`       | `CHECK (role IN ('USER','ADMIN'))`; promotion is a manual `UPDATE`, no endpoint                   |
| `pairs`                | `V1__init_users_and_pairs.sql` | Created by registration. `user1_id` is nullable to break the FK cycle: pair, then user, then link |

Redis keys, none of them in Postgres:

| Key                     | Value                                  | TTL        |
| ----------------------- | -------------------------------------- | ---------- |
| `refresh:<token>`       | user id and family id                  | 30 days    |
| `refresh:spent:<token>` | family id of a token already exchanged | 30 days    |
| `refresh:family:<id>`   | the set of tokens in one login's chain | 30 days    |
| `pwdreset:<token>`      | user id                                | 30 minutes |
| `emailverify:<token>`   | user id                                | 24 hours   |

## Business rules

| #    | Rule                                                                                                                                                | Why                                                                                                                                                   |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1  | The access token is a JWT valid for 15 minutes, sent as `Authorization: Bearer`, and the browser keeps it in memory only                            | A token in `localStorage` is readable by any script on the page. Fifteen minutes bounds what a stolen one is worth                                    |
| R-2  | The refresh token is opaque, lives in Redis, and reaches the browser only as an `HttpOnly; Secure; SameSite=Strict` cookie scoped to `/api/v1/auth` | It is the valuable credential: 30 days and self-renewing. Script cannot read it, and `SameSite=Strict` is what makes disabling CSRF on this path safe |
| R-3  | A refresh token is single-use. Every rotation issues a new one in the same family                                                                   | Without rotation a leaked token is valid for a month with no signal                                                                                   |
| R-4  | Replaying a spent refresh token revokes the entire family                                                                                           | A replay is either theft or a client bug and the server cannot tell which. One forced login beats an intruder renewing quietly for 30 days            |
| R-5  | Logout revokes the family, not just the presented token                                                                                             | After rotations the family holds the spent predecessors; leaving them would keep a stolen one usable                                                  |
| R-6  | A failed verification e-mail does not fail registration                                                                                             | The account already exists. A 500 would send the person back to register and hit "e-mail already taken"                                               |
| R-7  | `forgot-password` and `resend-verification` answer identically whether or not the account exists                                                    | Otherwise the endpoint is an account enumeration oracle                                                                                               |
| R-8  | Wrong password and unknown e-mail both raise `InvalidCredentialsException` with the same message                                                    | Same reason as R-7, on the login path                                                                                                                 |
| R-9  | Registration always assigns `Role.USER`                                                                                                             | An endpoint that can grant `ADMIN` is an escalation path                                                                                              |
| R-10 | Google sign-in is refused unless `email_verified` is true on the ID token                                                                           | Otherwise anyone able to mint an unverified Google identity for an address takes over the VitalPair account at that address                           |
| R-11 | A Google sign-in for an existing address reuses that user, and does not create a second tenant                                                      | Otherwise the same person ends up with two pairs and their data split between them                                                                    |
| R-12 | Auth limits count per IP, not per account                                                                                                           | An attacker spreads guesses across accounts, so a per-account limit never fires while one IP works through a password list                            |
| R-13 | The invite code alphabet excludes `I`, `O`, `0` and `1`                                                                                             | The code is read aloud and typed by the partner                                                                                                       |

## Security findings

### Fixed

| ID  | Severity | File                               | What happened                                                                                                       | Measured impact                                                                                                               | Fix                                                                                                                                                                                                      |
| --- | -------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-1 | High     | `MailSenderAdapter.java:62`        | With `MAIL_ENABLED=false` the whole reset and verification link, token included, was written to the application log | Anyone with log access could take over any account that had requested a reset. Every development and staging run was affected | The adapter never logs the link. `MailSenderAdapterTest` asserts on captured output that neither token nor full address appears                                                                          |
| A-2 | High     | `application-dev.yaml:15`          | A JWT signing secret was committed as a default                                                                     | Anyone with the repository could forge a token for any user on any deployment that had not overridden it                      | Default removed; `JwtProperties` is `@Validated` with `@NotBlank @Size(min=32)`, so an instance without a real secret refuses to start. `DevJwtSecretGeneratorTest` covers the dev-only generated secret |
| A-3 | High     | `AuthController` / `TokenResponse` | The refresh token was returned in the response body and stored in `localStorage`                                    | An XSS anywhere in the app yielded a 30-day self-renewing credential                                                          | Moved to the HttpOnly cookie described in R-2. `AuthFlowIT.registrationSetsTheRefreshCookieAndKeepsTheTokenOutOfTheBody` asserts the body no longer carries it                                           |
| A-4 | High     | `RedisRefreshTokenStore`           | Refresh tokens were neither single-use nor grouped, so a stolen one stayed valid until expiry                       | 30 days of undetected access per leak                                                                                         | Families with reuse detection (R-3, R-4), covered by a unit test and an integration test                                                                                                                 |
| A-5 | Medium   | none (missing control)             | No rate limiting on any auth endpoint                                                                               | A password list could be attempted at network speed                                                                           | `RateLimitFilter` with the policies in the endpoint table, backed by Redis so the counter survives a restart and is shared across instances                                                              |
| A-6 | Low      | `SecurityConfig.java:71`           | The 401 entry point wrote a bare string, not the API envelope                                                       | A client parsing the envelope broke on every expired session                                                                  | `JsonAuthenticationEntryPoint` returns `ApiResponse` with `requestId`                                                                                                                                    |

### Open

| ID  | Severity      | File                    | What happens                                                                                                                                                                                                                | Measured impact                                                                                                                                                                       | Why it is still open                                                                                            |
| --- | ------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| A-7 | Low           | `AuthController#logout` | Logout is not rate limited                                                                                                                                                                                                  | An attacker with a valid refresh cookie can revoke their own session repeatedly. There is no path to another user's session, because the family is looked up from the presented token | The endpoint acts only on the caller's own family, so the abuse is self-inflicted. Backlogged rather than fixed |
| A-8 | Low           | `RateLimitFilter`       | Limits key on `request.getRemoteAddr()` behind `server.forward-headers-strategy=native`. Correct behind the deployed nginx, which sets `X-Forwarded-For`; a misconfigured proxy would collapse every caller into one bucket | Not measured in production, since nothing is deployed yet. Verified locally that the deploy nginx sets the header (`deploy/nginx/proxy_params.conf`)                                  | Depends on the proxy being configured correctly, which the deploy smoke test does not yet assert                |
| A-9 | Informational | user-facing messages    | Exception messages reaching the user are Portuguese strings in Java, so the API is not translatable                                                                                                                         | Every non-Portuguese client sees Portuguese error text                                                                                                                                | Fixing it means error codes plus frontend translation, a change across every feature. Backlogged                |

### Verified and fine

| Check                                                     | How it was verified                                                                                                                                        | Date       |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Passwords are hashed, never stored or logged              | `PasswordEncoderAdapter` uses `BCryptPasswordEncoder` at strength 12; `users.password_hash` is the only column that holds it and no log statement takes it | 2026-09-06 |
| No account enumeration on the four public flows           | `AuthFlowIT.forgotPasswordDoesNotRevealWhetherAnAccountExists` and the identical message on login                                                          | 2026-09-06 |
| Server-side input validation                              | `@Valid` on all nine request records; `AuthFlowIT.invalidRegistrationIsA400ThatNamesTheFields` asserts a 400 listing the offending fields                  | 2026-09-06 |
| A forged or missing token is rejected on protected routes | `AuthFlowIT.protectedRoutesRejectMissingAndForgedTokens`                                                                                                   | 2026-09-06 |
| Rate limit counters land in Redis under the expected keys | `RateLimitIT.countersAreKeyedByPolicyAndCallerInRedis`                                                                                                     | 2026-09-06 |
| Registration cannot grant a role                          | `AuthService.createUserWithTenant` hardcodes `Role.USER`; no endpoint writes `users.role`, confirmed by grep                                               | 2026-09-06 |

## Tests

| Test                              | Type        | Risk it covers                                                                                                                                                                                                                     |
| --------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthServiceTest` (14 cases)      | unit        | Rotation, replay revoking a family, logout revoking a family, a replay of a token that never existed revoking nothing, Google creating and reusing a user, unverified Google e-mail refused, registration surviving a mail failure |
| `AuthFlowIT` (12 cases)           | integration | The whole flow across real Postgres, Redis and SMTP: cookie set and body clean, verification link delivered by Mailpit and confirming the account, rotation, replay, logout, 401 shapes, duplicate e-mail, 400 field list          |
| `MailSenderAdapterTest` (4 cases) | unit        | A-1. Asserts on captured log output that no token and no full address is written                                                                                                                                                   |
| `RateLimitIT` (4 cases)           | integration | A-5. The eleventh login is throttled even with the right password; per-user policies do not collapse into per-IP; unlimited routes carry no limit headers                                                                          |
| `RateLimiterTest`                 | unit        | Window arithmetic and the remaining count                                                                                                                                                                                          |
| `DevJwtSecretGeneratorTest`       | unit        | A-2. The development secret is generated, not committed                                                                                                                                                                            |
| `TenantIsolationIT`               | integration | Registration produces a tenant that no other pair can read                                                                                                                                                                         |
| `e2e/auth.spec.ts`                | browser     | Register, log in, log out and stay logged in across a reload, driven through the real UI                                                                                                                                           |

```bash
./mvnw test -Dtest='AuthServiceTest,MailSenderAdapterTest'
./mvnw verify -Dit.test='AuthFlowIT,RateLimitIT'
cd frontend && npx playwright test auth
```

### What is not covered

- **Concurrent refresh.** Two tabs rotating the same cookie at once is not tested. The
  second request finds the token spent and revokes the family, so the expected outcome is
  a forced login. Whether that happens in practice with the browser's cookie handling is
  not measured.
- **Google sign-in end to end.** `GoogleTokenVerifier` is mocked in every test. No test
  exchanges a real Google ID token, so a change in Google's token format would not be
  caught here.
- **Cookie attributes in a browser.** The `Set-Cookie` header is asserted as a string.
  No test confirms that a real browser refuses to expose it to script, or that
  `SameSite=Strict` blocks the cross-site case.
- **Redis unavailable.** No test covers the behaviour when Redis is down during login. The
  likely result is a 500 on every authentication, which is not what a person should see.
- **Password strength.** `RegisterRequest` enforces 8 to 100 characters and nothing else.
  There is no check against common passwords or breach lists.
- **Session count per user.** Nothing caps how many families a single account can hold, so
  a script with valid credentials can accumulate refresh tokens.

## How to verify in production

```sql
-- read only: accounts and their verification state
SELECT count(*) FILTER (WHERE email_verified) AS verified,
       count(*) FILTER (WHERE NOT email_verified) AS unverified,
       count(*) FILTER (WHERE password_hash IS NULL) AS google_only
FROM users;

-- read only: nobody was granted admin unexpectedly
SELECT email, role FROM users WHERE role <> 'USER';

-- read only: a user without a tenant would be a bug in registration
SELECT count(*) FROM users u LEFT JOIN pairs p ON p.id = u.tenant_id WHERE p.id IS NULL;
```

```bash
# read only: active sessions and detected replays
redis-cli --scan --pattern 'refresh:family:*' | wc -l
# a replay writes this line, with the family id
grep 'Refresh token replay detected' /var/log/vitalpair/app.log
```

## Known debt

| Item                                               | Impact                                                            | When it is meant to be addressed                 |
| -------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------ |
| A-9, Portuguese error messages in Java             | The API cannot be translated                                      | Backlog: error codes with frontend translation   |
| No cap on sessions per user                        | Unbounded refresh families per account                            | Backlog                                          |
| No test for Redis being unavailable                | An outage's user-facing behaviour is unknown                      | Backlog                                          |
| `AuthServiceTest` method names are half Portuguese | Predates the English rule; renaming them is churn on a green test | Next time the file is touched for another reason |

## History

| Date       | Change                                                           | Pull request             |
| ---------- | ---------------------------------------------------------------- | ------------------------ |
| 2026-09-05 | Refresh cookie, token families, reuse detection, roles (phase 6) | `feat/auth-hardening`    |
| 2026-09-05 | Token logging, dev secret, rate limiting (phase 5)               | `fix/security-hardening` |
| 2026-09-06 | Document created (phase 13)                                      | `docs/professional-docs` |
