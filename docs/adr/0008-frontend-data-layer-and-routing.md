# ADR 0008: Load each route on demand, keep server state in TanStack Query, and read errors through one helper

- **Status**: Accepted
- **Date**: 2026-09-06
- **Deciders**: Alisson Souto
- **Supersedes**: nothing
- **Superseded by**: nothing

## Context

Measured on 2026-09-05: the frontend shipped one 742.85 kB entry file, so a
visitor opening the two-field login form downloaded all 27 screens, the charts
and the onboarding flow. Every screen fetched its data with `useEffect` and
`useState`, with no cache, so returning to the dashboard re-issued seven
requests. Four pages had their own copy of an `apiMessage` helper to read the
server's error envelope, and the copies disagreed: one hid the generic
"Erro de validação" message, three showed it. An unknown URL silently
redirected to the dashboard, which sent logged-out visitors to the login page
with no explanation and made a broken link indistinguishable from a correct one.

## Decision

- **Every route is a `lazy(() => import(...))`** under one `<Suspense>`, so a
  screen's code arrives when the screen is opened. The legal texts, a third of
  all translations read by almost nobody, are a separately loaded i18n
  namespace.
- **Server state lives in TanStack Query.** Each feature declares its queries
  with `queryOptions` in a `queries.ts`; components read them with `useQuery`
  or `useQueries`, and mutations invalidate the keys they affect. The client
  does not retry 4xx responses or mutations, and data is fresh for 30 seconds.
- **One error reader.** `shared/api/errors.ts` exposes `getApiErrorMessage`,
  `getFieldErrors`, `getRequestId` and `getStatus`, and the four copies were
  deleted.
- **A real 404 page**, in all four languages, and a root `ErrorBoundary` that
  shows the request id from the failing response instead of a blank page.
- The `@/` import alias replaces relative paths.

## Alternatives considered

### Option A: keep `useEffect` fetching and add a cache by hand

Rejected. It would reinvent deduplication, staleness and invalidation, badly,
and the ten ESLint warnings about `setState` inside effects are the symptom of
exactly that pattern.

### Option B: a global store (Zustand) for server data

Rejected. Zustand stays for session state, which is genuinely client-owned.
Putting server responses in it means writing the cache logic Query already has,
and it was the pattern that produced the seven-request dashboard.

### Option C: SWR

Not chosen. Equivalent for this use; Query's `queryOptions` typing and its
DevTools were the deciding conveniences.

### Option D: route-based code splitting only for the heavy screens

Rejected. Splitting everything is the same amount of work as splitting some,
and the entry bundle is what a first-time visitor pays for.

## Consequences

### What this makes easier

Measured after: entry 476 kB in 46 chunks, Vite's large-chunk warning gone. The
dashboard paints its cheap queries immediately and an optional query failing
leaves the screen usable. Errors read the same on every screen.

### What this makes harder

Two of 27 screens use the new data layer; the rest were left for phase 10,
which is also incomplete on that point (10 lint warnings remain). A screen that
mixes both patterns is possible during the transition. Lazy routes add a
loading flash on first visit to each screen.

### What has to change

`AppRouter.tsx`, `queryClient.ts`, `errors.ts`, `NotFoundPage`,
`AppErrorBoundary`, `RouteFallback`, `locales/errors.ts`, `tsconfig` paths and
`vite.config.ts` alias. `react-router` was upgraded from 7.18.0 to 7.18.3 for a
high-severity advisory found by `npm audit` during the work.

## Verification

- `npm run build` lists one chunk per route.
- `grep -r apiMessage frontend/src` returns nothing.
- `frontend/src/shared/api/errors.test.ts` (9 cases).
- In a browser, `/does-not-exist` renders the 404 in the active language.

## References

- `docs/features/frontend-foundation.md`
- Phase 9 pull request.
