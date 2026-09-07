# ADR 0004: Store the refresh token in an HttpOnly cookie and rotate it in families

- **Status**: Accepted
- **Date**: 2026-09-05
- **Deciders**: Alisson Souto
- **Supersedes**: nothing
- **Superseded by**: nothing

## Context

Authentication issues two tokens: a signed JWT access token valid for fifteen
minutes and an opaque refresh token valid for thirty days, stored in Redis.
Until phase 6 both travelled in the login response body and the frontend kept
both in `localStorage`.

Anything in `localStorage` is readable by any script running on the page. A
single cross-site scripting hole anywhere in the application therefore yielded
the refresh token, which is worth thirty days of access and renews itself. The
access token's short life was providing no protection, because the long-lived
credential sat next to it.

The refresh token was already rotated on every use, but a spent token stayed
valid until its own expiry, so a stolen one worked for up to thirty days with no
signal to the server.

Nothing was deployed, so there were no existing sessions to migrate.

## Decision

The refresh token is delivered only as a cookie with these attributes:
`HttpOnly`, `Secure` (disabled solely in the development profile, where there
is no TLS), `SameSite=Strict`, `Path=/api/v1/auth`. It never appears in a
response body. `POST /api/v1/auth/refresh` and `POST /api/v1/auth/logout` read
it from the cookie and take no request body.

The access token stays in the response body and is held in memory by the
frontend only. On page load the frontend calls `/refresh` to obtain a new pair,
which is what makes a reload keep the session.

Refresh tokens are **single-use and grouped into families**. Every login starts
a family; every rotation issues a new token in the same family and marks the
old one spent. Presenting a spent token revokes the entire family. Logout
revokes the family, not just the presented token.

CSRF protection stays disabled on the API: with `SameSite=Strict` the browser
never attaches the cookie to a cross-site request, and every other endpoint is
authenticated by a header that a cross-site page cannot set.

## Alternatives considered

### Option A: keep both tokens in localStorage

Rejected. It is the status quo that motivated the change: one XSS is a
thirty-day credential.

### Option B: both tokens in cookies

Rejected. The access token is sent on every API call; as a cookie it would
travel on every request to the API origin including cross-site ones unless
`SameSite=Strict` were applied to it too, which breaks legitimate navigation
from external links. Keeping it in memory and sending it as a header is what
makes CSRF a non-issue for the API.

### Option C: rotation without families

Rejected. It is what existed before. Rotation alone gives the attacker a valid
token until the victim happens to rotate first; families detect the replay and
end both sessions, which is the only response that does not require telling
thief from victim.

### Option D: server-side sessions in Redis with a session cookie

Rejected. It removes the JWT entirely and makes every request a Redis lookup.
The stateless access token was kept because the management port, the rate
limiter and the tenant context already read claims from it, and a fifteen
minute JWT is cheap to keep.

## Consequences

### What this makes easier

An XSS is now worth fifteen minutes, not thirty days. A stolen refresh token is
detected on first replay and both sessions end, which is one forced login for
the owner instead of a month of quiet access for the thief. Logout actually
ends the session.

### What this makes harder

The frontend must call the API through the same origin, so development runs
the Vite proxy (`/api` forwarded to the backend) and a public demo needs a
single tunnel for both. Two tabs refreshing at the same instant can race: the
second finds the token spent and revokes the family, forcing a login. That
case is recorded as untested in `docs/features/auth.md`.

### What has to change

`RefreshTokenCookie` builds the cookie; `AuthController` sets it on register,
login, Google sign-in and refresh, and clears it on logout. `TokenResponse`
lost its `refreshToken` field. `RedisRefreshTokenStore` keeps `refresh:<token>`,
`refresh:spent:<token>` and `refresh:family:<id>`. The frontend `authStore` no
longer persists tokens; `client.ts` sends `withCredentials`.

## Verification

- `AuthFlowIT.registrationSetsTheRefreshCookieAndKeepsTheTokenOutOfTheBody`
- `AuthFlowIT.refreshRotatesTheCookieAndAReplayRevokesTheWholeFamily`
- `AuthFlowIT.logoutRevokesTheSessionAndClearsTheCookie`
- In a browser: DevTools → Application → Local Storage holds no token after
  login; the `vp_refresh` cookie shows HttpOnly and Secure.
- `e2e/auth.spec.ts`: a reload keeps the session.

## References

- `docs/features/auth.md`
- OWASP Cheat Sheet: Session Management, "Session ID Properties".
- Pull requests #21 and #22.
