# VitalPair frontend

The React application: what a person sees at `https://<domain>/`. It talks to the
backend through `/api/v1` on the same origin, which the Vite dev server proxies in
development and the edge proxy routes on a server.

This file is the map. How each part is built, and why, is in
[docs/features/frontend-foundation.md](../docs/features/frontend-foundation.md);
the browser tests are in [docs/features/browser-tests.md](../docs/features/browser-tests.md);
the visual system (colours, type, mockups, voice) is in [docs/design/](../docs/design/).

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query for server state,
Zustand for the little client state there is, react-hook-form with zod for every
form, react-i18next with four languages (`pt` is the reference; `en`, `es`, `fr`
are translations of it). Node 22 (`.nvmrc` at the repository root).

## Run it

```bash
npm ci
npm run dev            # http://localhost:5173, proxying /api to the backend on :8081
```

The backend has to be running (`./mvnw spring-boot:run` at the repository root);
without it every screen past the landing page shows the "no connection" notice.
`VITE_PROXY_TARGET` points the proxy somewhere else. Copy `.env.example` to
`.env` for the two variables the browser needs; both are optional.

## Scripts

| Command             | What it does                                                                 |
| ------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`       | Dev server with hot reload                                                   |
| `npm run build`     | Type check, then the production bundle in `dist/`                            |
| `npm run preview`   | Serves `dist/` on :4173, proxying `/api`; what the browser tests run against |
| `npm run typecheck` | `tsc -b --noEmit`. Use this, not a bare `tsc`, or you get a stale cache      |
| `npm run lint`      | ESLint, type-aware. Errors fail CI; `lint:strict` also fails on warnings     |
| `npm run test`      | Vitest, jsdom, MSW: the unit and component tests                             |
| `npm run coverage`  | The same, with a coverage report                                             |
| `npm run e2e`       | Playwright against `preview`, with a real backend. Needs Postgres and Redis  |
| `npm run deadcode`  | knip: exports and dependencies nothing uses                                  |

## Where things are

```
src/
  features/<name>/    one folder per screen: page, parts, queries, helpers, tests
  components/         building blocks shared by screens (ui/, brand/, auth/)
  shared/             api client helpers, form primitives, error handling, i18n hooks
  api/                one file per backend feature, typed against src/types
  locales/            one module per namespace, four languages side by side
  router/             the routes, each screen loaded on demand
  store/              auth session and theme
  test/               the test harness: render helpers, MSW server, fixtures
e2e/                  Playwright specs and their support
public/               static files served as-is (favicon, theme bootstrap)
```

## Rules that the tooling enforces

- **No hardcoded interface text.** Every string comes from `src/locales`, and a key
  that does not exist in `pt` fails `tsc` (`src/i18next.d.ts`). A key missing in
  one of the other three languages fails the parity test.
- **Every form is react-hook-form with a zod schema**, declared next to the page,
  with bounds mirroring the backend's request records. The message is an i18n
  key, so it exists in four languages.
- **No fetching in `useEffect`.** Server state goes through TanStack Query, in a
  `queries.ts` per feature.
- **A file is at most 325 lines** (blank lines and comments excluded). Components
  and plain values live in separate files, because a module that exports both
  breaks hot reload.
- **The API address is a path**, `/api/v1`, never a host. An absolute default once
  shipped to a server pointing at the developer's own machine.

## Tests

178 unit and component tests (`npm run test`) and 20 browser tests
(`npm run e2e`) at the time of writing; the numbers in
[docs/features/frontend-foundation.md](../docs/features/frontend-foundation.md)
are the ones kept up to date. The browser tests need the backend, Postgres and
Redis running; CI starts all three.

## Before a pull request

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

The pre-commit hook formats and lints what is staged; the commit message follows
Conventional Commits. See [CONTRIBUTING.md](../CONTRIBUTING.md).
