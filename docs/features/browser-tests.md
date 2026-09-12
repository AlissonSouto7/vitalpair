# Feature: browser tests and accessible forms

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-12

## What it is and where it lives

A Playwright suite that drives the real application in a real browser, plus the
form primitives the suite needs to exist at all: inputs whose labels are actually
attached to them.

|                   |                                             |
| ----------------- | ------------------------------------------- |
| Frontend route    | none directly; the suite drives all of them |
| Who can access it | developers and CI                           |
| Backend package   | none                                        |
| Feature flag      | none                                        |

## Architecture

| Layer           | Files                                                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Configuration   | `frontend/playwright.config.ts`                                                                                                        |
| Shared setup    | `frontend/e2e/support/session.setup.ts`, `frontend/e2e/support/accounts.ts`                                                            |
| Specs           | `auth`, `navigation`, `accessibility`, `errors`, `onboarding`, `nutrition`, `pair`, all under `frontend/e2e/`                          |
| Form primitives | `frontend/src/shared/ui/form/TextField.tsx`, `NumberField.tsx`, `Field.tsx`, `FormError.tsx`; `DateField` and `Select` in `components` |
| Forms           | Every file with a `<form>` uses react-hook-form and zod; the list is in [frontend-foundation.md](frontend-foundation.md)               |
| CI              | `.github/workflows/ci.yml`, job `e2e`                                                                                                  |

### How to run

```bash
# Needs the backend on :8081 and CORS allowing http://localhost:4173
npm --prefix frontend run build
npm --prefix frontend run e2e          # headless
npm --prefix frontend run e2e:ui       # interactive
npm --prefix frontend run e2e:report   # open the last report
```

## Business rules

- **The suite runs against the production build**, served by `vite preview`, not
  the dev server. The dev server transforms modules on demand and hides bundling
  mistakes that only appear in the artefact users receive.
- **The rate limits are raised for this suite only.** It runs serially from one
  address and renews the session on every screen it opens, so it competes with
  itself for an allowance sized for one person. `refresh` runs out first, at
  about one call per page load, and the symptom was a different test failing on
  each run. The CI job sets `VITALPAIR_RATELIMIT_{LOGIN,REGISTER,REFRESH}_PER_MINUTE`;
  production keeps 10, 5 and 30, the defaults in the code. `RateLimitIT` still
  proves the guard at the production numbers and `RateLimitFilterTest` proves the
  configuration is read. Measured before the change: two consecutive runs of the
  suite already failed, with no new tests, and nobody had seen it because nobody
  ran it twice in a row. After: three consecutive runs, 19 tests passing in each.
- **The suite is serial, on purpose.** Every test signs in as the same account
  against one backend, and registration is rate-limited to five a minute per
  address. Measured: 10 of 12 passing in parallel against 12 of 12 serially. The
  limit is correct; the suite adapts to it rather than the limit being weakened.
- **One account for the whole run.** A setup project registers it once and saves
  its credentials; the specs that are not about registering sign in as it.
- **The interface language is pinned to Portuguese** before anything is
  asserted. Matching text in four languages at once is unreadable and matches the
  wrong control; the language switch has its own test.
- **A form validates before it submits.** The browser's `required` and
  `type="email"` are convenience, not a guard, and their messages are the
  browser's, in the browser's language. `AuthFlowIT` proves the server validates
  regardless.
- **The accessibility walk navigates inside the app and waits for each route's
  chunk.** Reloading the app on every route renewed the session each time and
  exhausted the 30-a-minute refresh limit halfway through; navigating in the app
  fixed that and made the test six times faster. Checking a page before its code
  had arrived found no controls at all, which is how the first version passed
  with an unlabelled field planted on purpose. The walk also opens a tab a free
  account can see: the photo tab is closed to free accounts since #95, and a walk
  that stopped there never reached the search field (N-6 in
  [nutrition.md](nutrition.md)).

## Security findings

### Fixed

| ID  | Severity | What happened                                                                                                                                                                                                                                                                                                                                                  | Measured impact                                                                                                                                                                                                                                    | Fix                                                                                                                                                                                                                                                                                                                           |
| --- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-1 | Medium   | Form fields had no accessible label. The forms wrote `<label>` next to `<input>` with nothing linking the two. To a screen reader the field was an unnamed edit box, and clicking the text did not focus the field. Found because the browser test could not find the fields by label, the same path assistive technology uses                                 | 20 loose labels in 8 files                                                                                                                                                                                                                         | Zero at the end. `TextField`, `NumberField` and `Field` generate the `id` and wire `htmlFor`, `aria-invalid` and `aria-describedby`; `NumberField` replaced two identical copies of the same component that lived on different screens, each with the same defect. `accessibility.spec.ts` guards the regression on 8 screens |
| A-2 | Medium   | The dropdown had no semantics. `Select` is built from buttons so it can be styled, which costs accessibility unless paid for: without `role="combobox"`, `aria-expanded` and `role="listbox"`, assistive technology does not know it is a selector, what is selected, or whether the list is open                                                              | Every dropdown in the product                                                                                                                                                                                                                      | The three attributes added                                                                                                                                                                                                                                                                                                    |
| A-3 | Low      | The invite field was identified by its placeholder only. A placeholder disappears at the first typed character and may never be announced                                                                                                                                                                                                                      | One field                                                                                                                                                                                                                                          | The field carries the section title as its name                                                                                                                                                                                                                                                                               |
| A-4 | Medium   | The date group had no accessible name. `DateField` draws `role="group"` around three dropdowns and the label pointed at it with `<label htmlFor>`. A `label` names a form control, and a group is not one: the group came out anonymous and a screen reader read three unnamed dropdowns. Found by the onboarding test, which could not find the group by name | The birth date on onboarding and on the profile                                                                                                                                                                                                    | `aria-labelledby` names a group, so `labelId` became required instead of optional, and `Field` gained `labelsAGroup` to render `<span id>` instead of `<label htmlFor>`                                                                                                                                                       |
| A-5 | High     | The birth date could not be filled in. `DateField` kept no state: it read day, month and year back from `value`, and `value` only becomes an ISO date once all three exist. Choosing the day emitted `''`, the component re-read `''` and the dropdown fell back to the placeholder. All three together did not work either                                    | Measured in a real browser choosing day, month and year in turn: `AFTER ALL THREE ["Dia","Mês","Ano"]`. Step 1 of onboarding requires the date, so no new account could finish signing up, and the date could not be changed on the profile either | The three parts are kept in the component and adjusted during render when the parent changes `value`. `DateField.test.tsx`: 2 of 3 failing before, all passing after; reintroducing the original bug fails 2 of them                                                                                                          |

### Verified and fine

| Check                                   | How it was verified                                                                                                                      | Date       |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| A form error is announced               | `FormError` and the field messages use `role="alert"`                                                                                    | 2026-09-06 |
| The password strength bar is decorative | Marked `aria-hidden`, so it is not read as content                                                                                       | 2026-09-06 |
| The registration limit per IP works     | It is what broke the suite when the tests ran in parallel, which is the proof it is active                                               | 2026-09-06 |
| No credentials in code                  | The suite generates unique e-mail addresses and uses a test password; no real account                                                    | 2026-09-06 |
| No production vulnerability             | `npm audit --omit=dev` reports zero after installing Playwright, react-hook-form and zod; re-measured on 2026-09-12 with the same result | 2026-09-12 |

### Open

- **The suite needs `http://localhost:4173` in CORS.** Without it every request
  answers 403 and the tests fail for a reason that is not the app. It is in
  `.env.example` and in the CI job.

## Tests

| Test                        | Risk it covers                                                                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.spec.ts` (7)          | Registration that does not lead inside; broken login; the session lost on reload; an error with no message; an invalid form calling the server; a protected route open |
| `navigation.spec.ts` (4)    | A 404 redirecting silently; a legal page showing a translation key; a screen whose chunk does not load; the language switch broken                                     |
| `accessibility.spec.ts` (2) | A-1 regressing: any control without a label on 8 screens fails the build                                                                                               |
| `onboarding.spec.ts` (2)    | The five steps every new account walks once; an empty form refused with a message per field and `aria-invalid`. Found A-4 and A-5                                      |
| `nutrition.spec.ts` (1)     | A meal that saves and vanishes from the day's list. Found the day-boundary bug in [day-boundary.md](day-boundary.md)                                                   |
| `pair.spec.ts` (1)          | The flow that defines the product: invite, then acceptance with both sides confirming; a nonexistent code with no message; a dead invite link failing silently         |
| `errors.spec.ts` (1)        | A 5xx with no notice on screen and no request id                                                                                                                       |
| `DateField.test.tsx` (6)    | A-5 regressing: a partial date falling back to the placeholder, a complete date not becoming ISO                                                                       |
| `errors.test.ts` (9)        | Reading an API error                                                                                                                                                   |
| `locales.test.ts` (97)      | A translation key missing in one language                                                                                                                              |

The spec counts were read from the files on 2026-09-12; the two unit-test
counts come from `npx vitest run` on the same day.

### What is not covered

- **Chromium only.** Firefox and Safari are configured in Playwright and not
  enabled; three browsers triple the time without, today, covering a known risk.
- **Generating an AI plan has no path**, because it would spend a paid call on
  every run. Inviting, accepting, onboarding and logging a meal do.
- **One path per flow.** The pair test covers inviting and accepting; it does not
  cover ending the pair and starting again with somebody else, nor an invite that
  is no longer valid.
- **No responsive or mobile-viewport test.**
- **No mocking in the browser.** The specs use the real backend, which is more
  faithful and is what exposed the CORS and rate-limit problems. Component tests
  with MSW live in [frontend-foundation.md](frontend-foundation.md).

## Known debt

| Item                | Impact                                            | When it is meant to be addressed |
| ------------------- | ------------------------------------------------- | -------------------------------- |
| One browser         | A Firefox- or Safari-only regression ships        | When a known risk needs it       |
| No mobile viewport  | A layout that breaks on a phone is not caught     | With the responsive work         |
| No test ends a pair | The leave flow is covered by component tests only | Next change to the suite         |

## History

| Date       | Change                                                                                                                                                                 | Pull request |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 2026-09-11 | The accessibility walk opens the search tab, which a free account can see, and found N-6                                                                               | #99          |
| 2026-09-11 | The walk waits for five route chunks on CI                                                                                                                             | #98          |
| 2026-09-09 | Onboarding step 1 on react-hook-form; `onboarding.spec.ts` asserts the message next to the field and `aria-invalid` on the empty one                                   | #85          |
| 2026-09-09 | `pair.spec.ts`: two people in separate browser contexts, the invite read from the screen, both sides confirming. The three auth rate limits became configuration       | #73          |
| 2026-09-08 | `onboarding.spec.ts`, which found A-4 and A-5                                                                                                                          | #66          |
| 2026-09-06 | Playwright with 14 tests, the CI job, accessible form primitives, four forms on react-hook-form and zod. A-1, A-2 and A-3 fixed on every screen with a regression test | #29          |
