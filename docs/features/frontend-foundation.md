# Feature: frontend foundation

- **Status**: shipped, with the debt listed at the end
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-12

## What it is and where it lives

The shared parts of the React application: how code reaches the browser, how a
screen fetches data, how a form validates and sends, how an error is turned into
something a person can read, and what happens when a route does not exist or a
render throws.

|                   |               |
| ----------------- | ------------- |
| Frontend route    | all of them   |
| Who can access it | every visitor |
| Backend package   | none          |
| Feature flag      | none          |

## Architecture

| Layer                      | Files                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Routing and code splitting | `src/router/AppRouter.tsx`                                                                                     |
| Data client                | `src/shared/api/queryClient.ts`, `src/features/dashboard/queries.ts`                                           |
| Error reading              | `src/shared/api/errors.ts`                                                                                     |
| Forms                      | `src/shared/ui/form/{Field,TextField,NumberField,FormError}.tsx`; react-hook-form + zod, schema in the page    |
| Failure screens            | `src/shared/ui/NotFoundPage.tsx`, `src/shared/ui/AppErrorBoundary.tsx`, `src/shared/ui/RouteFallback.tsx`      |
| On-demand translations     | `src/locales/index.ts` (`loadLegalNamespace`), `src/shared/i18n/useLegalNamespace.ts`, `src/locales/errors.ts` |
| Server-failure notice      | `src/shared/api/notifyServerFailure.ts`, called from the axios response interceptor                            |
| Providers                  | `src/App.tsx`                                                                                                  |
| Alias                      | `tsconfig.app.json` (`paths`), `vite.config.ts` and `vitest.config.ts` (`resolve.alias`)                       |
| Test harness               | `src/test/{setup.ts,render.tsx,fixtures.ts}`, `src/test/msw/{server.ts,api.ts}`                                |

## Business rules

- **Every route is loaded on demand.** With static imports the application
  shipped as one file of 742.85 kB, so a visitor opening the login form
  downloaded all 27 screens with it.
- **The legal texts are their own chunk.** They are 69 kB of the 202 kB of
  translations, in four languages, for three pages a person visits once if ever.
  `useLegalNamespace` fetches them when one of those pages opens and the page
  waits, because rendering first would show raw translation keys.
- **A 4xx is never retried.** The same request will fail the same way, and a 401
  is already handled by the axios interceptor, which refreshes and replays once.
- **A mutation is never retried.** It is a deliberate action by a person;
  repeating it silently could log the same meal twice.
- **Errors are read in one place.** Four pages carried their own copy of the same
  helper, each subtly different: one filtered the backend's generic validation
  message, three showed it to the user. All four behave the same now.
- **Every form validates before it sends, in the product's language.** The
  browser's own `required` and `type="email"` are bypassed trivially and their
  messages come in the browser's language, so every form sets `noValidate` and
  validates with a zod schema declared in the page. Constraints carry no text;
  the message is an i18n key attached at render time, in all four languages.
  Bounds mirror the backend's request records, so the person hears about a slip
  here rather than after a round trip. The server validates regardless; the
  schema is about the message, not the guarantee.
- **A translation key is a compile-time fact.** `src/i18next.d.ts` types every
  `t()` against the `pt` bundle through i18next's `CustomTypeOptions`, so a key
  that is misspelled, renamed or never added fails `tsc` in the file that uses
  it. Before, it built, shipped, and showed the raw key on screen. The parity
  test keeps its job: it proves `en`, `es` and `fr` carry the same keys as `pt`.
  Together they mean a key that resolves in one language resolves in all four.
  The lazily loaded `legal` namespace is in the type even though its chunk
  arrives later, because the pages that use it are written before it has.
- **A form never sends a blank.** A zero step count, an empty weight, a workout
  with no measure and a whitespace invite code all used to reach the server, or
  vanish with no message. Each is refused with a sentence next to the field.
- **A failed save is always shown.** Every submit handler catches and renders
  through `getApiErrorMessage`, so a person is never left believing something was
  saved when it was not.
- **The contact form hands the message to the mail client.** There is no endpoint
  for it, and a public one that sends e-mail is a spam relay until it has rate
  limiting and a challenge in front of it. `mailto:` means the message actually
  leaves, and no server of ours can be abused to send it.
- **An unknown path shows a 404.** Every unknown path used to redirect to the
  dashboard, which sends a logged-out visitor to the login screen for no stated
  reason and hides a broken link behind what looks like a working one.
- **A render error shows the request id** when the error carries one, so a report
  from a user points straight at the server log line (see
  [observability.md](observability.md)).
- **Only a server failure raises a toast.** `notifyServerFailure` fires on a 5xx
  or on no response at all (offline, DNS, server down). A 400 or 422 belongs to
  the screen, which puts the message next to the field, and a toast on top would
  say the same thing twice; a 401 is handled by the refresh and, when that fails
  too, by the trip to the login screen. The toast carries the request id, and the
  same failure does not stack twice: one broken screen fires several requests,
  and four identical toasts are noise.

## Security findings

### Fixed

**F-1 (high): react-router with a known vulnerability.** `react-router` 7.18.0
was subject to [GHSA-qwww-vcr4-c8h2], a CSRF bypass in RSC mode. The project does
not use RSC, so the practical impact was nil, but it was a vulnerable production
dependency. Updated to 7.18.3; `npm audit --omit=dev` went from 2 high
vulnerabilities to zero (measured).

**F-2 (medium): the contact form discarded the message.** `ContactPage.tsx`
showed a "message received" confirmation for a message nothing read: the fields
were uncontrolled and `onSubmit` only changed state. It now validates all three
fields and opens the visitor's mail client with the subject and body filled in,
and the confirmation text says so.

**F-3 (medium): saving the weight in the profile had no `catch`.**
`ProfilePage.tsx` called `recordWeight` in a `try/finally` with no `catch`. A
server failure became an unhandled rejection and the person saw nothing,
believing the weight had been saved. The copy of the same screen in
`ProgressPage.tsx` did handle it. Both became one component, `WeightForm`.

**F-4 (low): no upper bound on the weight in two screens.** Nothing stopped
recording 1000 kg, which drew a spike on the chart. The form now accepts 20 to
500 kg, the same bound as the profile. The server still accepts up to 999.99,
which is listed under Open.

**F-5 (low): `NaN` in the request body.** `toNumber` in `ActivityPage.tsx`
returned `Number("abc")` without checking. A numeric field now arrives as a
number or as absent, never as `NaN`.

**F-6 (low): an empty workout became a record.** The workout form had no guard;
submitting it blank stored an activity with every measure null, which appeared in
the day's list worth zero calories. It now requires at least one measure. The
server still accepts it, which is listed under Open.

**F-7 (low): the backend's generic validation message shown to the user.**
`PairPage.tsx` and `ProfilePage.tsx` read `err.response.data.message` by hand and
showed the generic text that `errors.ts` already filtered. Both use the helper
now.

**F-8 (low): three silent returns.** A zero step count, a zero weight and an
empty weight left the handler with no message: the person clicked and nothing
happened. Each case has a sentence now.

**F-9 (low): the bell's accessible name changed on its own.** The counter's
`<span>` sits inside the `<button>`, so its text became part of the accessible
name: the control announced itself as "Notifications 2" at one moment and
"Notifications" at another, as the number arrived and was cleared. A name that
moves with the data is a moving target for anyone navigating by name.

The button now has a fixed `aria-label`, which wins over the content, and the
counter is announced through `aria-describedby`, where it is detail rather than
identity. It also gained the `aria-expanded` that a control opening a panel was
missing. Found because the component test could not find the button by name once
the count arrived, which is exactly what assistive technology faces. Removing the
`aria-label` fails 2 of the 6 tests.

### Verified and fine

- **No production vulnerability**: `npm audit --omit=dev` returns zero. The
  remaining advisories are in build tooling, which never reaches the user's
  browser.
- **The client's bounds match the server's**: name 1 to 100, height 50 to 300,
  profile weight 20 to 500, birth date in the past, steps a positive integer,
  workout measures non-negative, invite code 8 characters from `AuthService`'s
  alphabet. Checked record by record against `UpdateProfileRequest`,
  `LogActivityRequest`, `RecordWeightRequest` and `AuthService.generateInviteCode`.
- **The `mailto:` cannot be injected**: subject and body go through
  `encodeURIComponent`, so `&`, `?` and a line break become escapes and the
  message cannot append a `cc=` or `bcc=` to the URL.
- **No token in storage**: the refresh token lives in an HttpOnly cookie and
  nothing here reintroduces a credential in `localStorage`.
- **No raw HTML**: no `dangerouslySetInnerHTML` anywhere in `src`.
- **The error id on screen is not sensitive**: it is a server-generated UUID with
  no relation to the user.

### Open

- **`RecordWeightRequest` accepts up to 999.99 kg** while `UpdateProfileRequest`
  bounds the same quantity at 500. The client uses 20 to 500 on both screens, but
  a direct API call still stores 3 kg. The change belongs to the progress feature
  (recorded as P-4 in [progress.md](progress.md)).
- **`LogActivityRequest` accepts every measure null.** The client requires one; a
  direct call still stores the empty row. It needs a cross-field validation on
  the server, with a test.
- **There is no contact endpoint.** `mailto:` is the honest path until there is
  one, and a public endpoint that sends e-mail needs rate limiting and a
  challenge before it exists.

## Tests: what each one protects

| Test                                                  | Risk it protects against                                                                                                                                                                                                     |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/api/errors.test.ts` (9)                   | the backend's generic message leaking to the user; field violations lost; the error id not shown; a network error treated as an API error                                                                                    |
| `src/locales/locales.test.ts` (97)                    | a translation key missing from one of the four languages                                                                                                                                                                     |
| `tsc` with `src/i18next.d.ts`                         | a wrong, renamed or never-created key in any `t()` fails the build                                                                                                                                                           |
| `src/features/progress/ProgressPage.test.tsx` (5)     | an empty, zero or 1000 kg weight sent to the server (F-4, F-8); a valid weight sent as a number and the chart reloaded; an invisible server failure                                                                          |
| `src/features/profile/ProfilePage.test.tsx` (6)       | an invisible failure when saving the weight (F-3); an empty name, a height outside 50 to 300 and a missing sex sent; the sex message far from its field; the PUT body carrying numbers as numbers                            |
| `src/features/onboarding/OnboardingPage.test.tsx` (5) | step 1 advancing empty, without saying what is missing, or with a height of 10 cm; step 2 saving with no level; typed input lost on going back; the PUT body with numbers as numbers and the date built from three dropdowns |
| `src/features/activity/ActivityPage.test.tsx` (7)     | zero or no steps sent with no message (F-8); a workout with no measure stored (F-6); a negative distance sent; the quick buttons adding up wrong; a run sent with the distance alone                                         |
| `src/features/pair/PairPage.test.tsx` (5)             | a blank or malformed code sent; a code not normalised; the generic validation message shown (F-7); the server's specific message lost                                                                                        |
| `src/features/legal/ContactPage.test.tsx` (3)         | the message discarded with a false confirmation (F-2); empty fields or an invalid e-mail accepted; the `mailto:` subject and body missing the data                                                                           |
| `src/shared/api/notifyServerFailure.test.ts` (6)      | the request id missing from a 5xx notice; a toast on a 4xx or 401; silence when there was no response; the same failure stacking                                                                                             |
| `e2e/errors.spec.ts` (1)                              | the toast never reaching the screen: the unit test mocks `sonner`, so a `Toaster` mounted and never fed would pass it                                                                                                        |

Every refusal is proved twice: the message is on screen and the request did not
leave. An MSW handler records each body it receives and the test asserts the list
is empty. The message alone would pass for a form that shows the text and sends
anyway.

The refusals were also checked by sabotage: with the weight bounds, the
"at least one measure" rule and the raw error reading in the pair screen all
broken at once, exactly the five tests that guard those rules failed and the
other eighteen in the batch stayed green.

How to run: `npm --prefix frontend test`. The harness forces `pt` (jsdom declares
itself `en-US`), disables TanStack Query retries, and fails any request with no
registered handler, so a test never passes on a response left behind by another.

### What is not covered

- **The meal editor** is deliberately not a form: it is a list of draft items
  with quantities rather than something with a submit, and it has its own tests.
- **Invite and accept in a browser** has no end-to-end path, because it needs a
  second browser context.
- **`queryClient`** has no test of its retry policy.
- **`useLegalNamespace`** is exercised indirectly by the contact test, which
  waits for the namespace to load; it has no test of its own.

## How to verify in production

```bash
# The entry bundle must not grow back into a single file
npm --prefix frontend run build | grep "index-"

# Nothing vulnerable in what reaches the browser
npm --prefix frontend audit --omit=dev

# Every file with a <form> uses react-hook-form (both lists must match)
grep -rl "<form" frontend/src --include="*.tsx" | grep -v test | sort
grep -rl "<form" frontend/src --include="*.tsx" | grep -v test | xargs grep -l useForm | sort
```

## Known debt

Measured on 2026-09-12.

- **Three files above 300 lines.** `max-lines` is an error at 325, counted
  without blank lines or comments, so the next screen that grows breaks the
  build. The translation bundles (`src/locales/`) are exempt, because their
  length is their content: `legal.ts` is over a thousand lines of legal text in
  four languages, and no decomposition shortens a privacy policy.

  | File                 | Lines | Why                                                   |
  | -------------------- | ----- | ----------------------------------------------------- |
  | `NutritionPage.tsx`  | 368   | one flow: tabs, draft, save, the day's list           |
  | `MealPlanPage.tsx`   | 343   | one flow: the plan, the chosen day, generate and swap |
  | `progress/parts.tsx` | 304   | the panels, which are long SVG                        |

  The first two are flow rather than presentation. Splitting further would mean
  two files reading the same state, which makes the number look better and the
  code worse. This is a deliberate stop.

- **The fast-refresh rule shaped the split.**
  `react-refresh/only-export-components` is an error and only appears in the
  pre-commit hook, not in `npm run lint`: a module exporting a component and a
  value together breaks hot reload, because React cannot tell the two apart and
  reloads the page. Every split feature therefore has one file of components and
  another of constants and helpers.
- **The feature-first layout was not done.** The folders are still
  `src/features`, `src/components`, `src/api`. The `@/` alias exists, which was
  the precondition; moving the files is a large diff with no immediate functional
  gain.
- **The entry chunk is 279.95 kB**, dominated by React, i18next and the
  translation bundles for four languages, with React and zod in chunks of their
  own. Splitting by language would mean restructuring the 22 translation files,
  because each one exports `{ pt, en, es, fr }` together.
- **`lucide-react` was removed.** It had been installed to replace the duplicated
  SVGs with ready-made icons and was never imported. The colour law asks for the
  product's own icons rather than a generic library, so the SVGs stay.
- **Hand-written buttons remain** while `components/ui/Button.tsx` exists and
  nothing imports it. The component is where the buttons' colour law is written,
  so it was kept and listed in `knip.json`; standardising the screens is still to
  do.
- **`ProfilePage.changeGoal` resends the whole profile with `sex` and
  `activityLevel` cast**, without a null check. If the profile does not have
  those fields yet, the PUT fails with a 400 and the screen says it could not
  change the goal.

## History

| Date       | Change                                                                                                                                                                                                                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-09 | Onboarding step 1 moved to react-hook-form, sharing the profile's schema so the first form a person fills and the one they edit later cannot disagree about a valid profile. One message per field, in four languages                                                                         |
| 2026-09-09 | Translation keys typed through `CustomTypeOptions`, which exposed 68 places where `t` accepted any string                                                                                                                                                                                     |
| 2026-09-09 | The large screens were split: 15 files above 300 lines became 4, measured with `wc -l`                                                                                                                                                                                                        |
| 2026-09-09 | The nine screens still fetching in a `useEffect` moved to TanStack Query; `season` and `missions.flash` now read the same key the dashboard and profile use, so screens cannot disagree about the current season                                                                              |
| 2026-09-09 | Component tests for `ProtectedRoute`, `NotificationsBell` and `CalorieRing`, which found F-9                                                                                                                                                                                                  |
| 2026-09-09 | The server-failure toast started carrying the request id, with 6 unit tests and one browser test                                                                                                                                                                                              |
| 2026-09-08 | Seven screens and the header bell left `useEffect` for TanStack Query, taking the lint warnings to zero. Each migration fixed a defect of its own: a search race, a favourites tab left empty after a failure, a `delete` with no `catch`, the feed discarding loaded pages on every reaction |
| 2026-09-08 | The five remaining `<form>` files moved to react-hook-form + zod, with 21 new message keys in four languages. F-2 to F-8 fixed; `WeightForm` replaced two copies; MSW entered with the harness in `src/test/`                                                                                 |
| 2026-09-08 | Cleanup: unused components and exports removed, `knip` added to the repository                                                                                                                                                                                                                |
| 2026-09-06 | The `@/` alias, per-route code splitting, a real 404, an error boundary, one error helper, TanStack Query on the dashboard and progress, on-demand legal texts, and react-router updated for F-1. Entry chunk from 742.85 kB to 476 kB                                                        |
