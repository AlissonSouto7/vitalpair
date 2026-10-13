# Feature: onboarding

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-10-13

## What it is and where it lives

The five questions that turn a fresh account into a usable one: who the person
is, how they move, the target that follows from both, who they are competing
with, and what is at stake. Without it the dashboard has no calorie target, no
goal and no season, which is the product with its centre removed.

It is the second screen anybody sees, and the only time they answer any of this.

|                   |                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| Frontend route    | `/onboarding`                                                                                             |
| Who can access it | any signed-in account; `RequireOnboarding` sends people here while `profile.goal` is null                 |
| Frontend package  | `frontend/src/features/onboarding` (1,446 lines)                                                          |
| Backend           | no package of its own: it writes through `PUT /users/me` (`user`) and reads `GET /users/me/tdee` (`tdee`) |
| i18n namespace    | `onboarding`                                                                                              |

## Architecture

| Layer          | Files                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| Page           | `OnboardingPage.tsx` owns the form, the step number and the two requests                     |
| Steps          | `StepAboutYou.tsx` (step 1), `Steps.tsx` (steps 2 to 5), `StepParts.tsx` (the shared pieces) |
| Form schema    | `onboardingForm.ts`, zod, shared by the page and the steps through `FormProvider`            |
| Options        | `options.tsx` builds the sex, goal, activity and step labels from the catalogue              |
| Shared widgets | `Select` (a combobox built from buttons), `DateField`, `CalorieRing`, `ThemeToggle`          |

The form lives in the page rather than in the steps on purpose: steps 1 and 2
are one profile, sent in a single request when step 2 is left, and going back
has to show what was typed.

### The five steps

| #   | Label    | What it asks                                   | What it writes                                                         |
| --- | -------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | Você     | name, weight, height, birth date, sex, goal    | nothing yet, held in the form                                          |
| 2   | Rotina   | activity level                                 | `PUT /users/me` with steps 1 and 2 together, then `GET /users/me/tdee` |
| 3   | Sua meta | nothing: it shows the calorie and macro target | nothing                                                                |
| 4   | Parceria | with somebody (invite code) or alone           | `POST /pair/join/{code}` when a code is given                          |
| 5   | Aposta   | what the winner gets                           | the stake, on the way to the dashboard                                 |

## Business rules

| #   | Rule                                                                               | Why                                                                                                                                                                                                                                                                |
| --- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| O-1 | The profile is sent once, when step 2 is left, not field by field                  | Steps 1 and 2 are one profile. Saving twice would leave an account half described if somebody closed the tab between them                                                                                                                                          |
| O-2 | Going back keeps what was typed                                                    | The form is owned by the page. Losing five answers because somebody wanted to check one is how a person abandons a signup                                                                                                                                          |
| O-3 | Each field says what is wrong with it, next to it                                  | It used to be one banner reading "fill everything in" without saying what was missing                                                                                                                                                                              |
| O-4 | A birth date in the future cannot be typed: `DateField` sets `max` to today        | The browser refuses it before the form has to. There is no `min`, because the backend only validates `@Past` and inventing a minimum age here would be a rule the product does not have                                                                            |
| O-5 | The partner step can be skipped with "Só eu por enquanto"                          | Most people arrive without a pair. Requiring one would end the signup for everybody who came to try it alone                                                                                                                                                       |
| O-6 | The step is announced as "N de 5 · Label", with a bar                              | Five questions with no end in sight read as an interrogation                                                                                                                                                                                                       |
| O-7 | The target weight is asked only of somebody chasing one, and is optional even then | Without it the product knows somebody wants to lose weight and not how much, so it cannot show progress. "Maintain" and "improve fitness" do not see the field, because a target weight there is a question nobody asked, and not everybody wants to name a number |
| O-8 | A target that contradicts the goal is refused in step 1, before the request        | The server refuses it too; this is the same warning arriving before the round trip. The rule had to become its own function: zod only runs object-level refinements once every field passes, and the routine has not been answered yet at that point               |

## Usability, found in the screen-by-screen sweep of 2026-09-28

| ID  | Severity | File                                                     | What happened                                                                                                                                                                                                                                                                                                                              | Measured impact                                                                                                                                                                                       | Fix                                                                                                                                                                                                                                                                                           |
| --- | -------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U-5 | Medium   | `Select.tsx`                                             | The sex field is a combobox built from buttons. It opened with Enter and Space, because it is a `<button>`, and then the arrow keys did nothing: measured in the browser, `aria-activedescendant` stayed null and the highlight never moved. It also had no `aria-controls`, so nothing tied the button to the list that had just appeared | Anybody using a keyboard or a screen reader, on the second screen of the product. They had to Tab through each option in turn, and a screen reader kept announcing the button while the list was open | Arrows move and wrap, Home and End jump to the ends, Enter chooses the highlighted option and closes, Escape closes without choosing, and the list opens on what is already selected. `aria-controls` and `aria-activedescendant` now say what is going on. Eight tests, all proven red first |
| U-6 | Medium   | `OnboardingPage.tsx`                                     | The only error message in the whole flow had no `role="alert"`. Measured with a wrong invite code: the server answers 404, the screen writes "Convite inválido", and the form does not advance                                                                                                                                             | For somebody who sees, the red explains. For somebody using a screen reader, the button simply did nothing. It covers the failed target calculation and the missing field too                         | `role="alert"` on the message                                                                                                                                                                                                                                                                 |
| U-7 | Low      | `ThemeToggle.tsx`, `AuthShell.tsx`, `OnboardingPage.tsx` | Three copies of the theme button, and they had already diverged: an emoji (☾) at 36px with a `--hair` border here, an SVG at 36px there, and the real component at 44px with `--edge`. The component's own comment warned that duplicating it in three places is how the three versions diverge                                            | Both 36px copies were below the 44px touch target, on the two screens somebody meets first. The emoji also renders as a different picture on every platform                                           | Both copies replaced by `<ThemeToggle />`. Measured after: 44x44                                                                                                                                                                                                                              |
| U-8 | Low      | `index.css` (`.btn-ghost`), `Steps.tsx`                  | "Voltar" measured 42px tall, two below the touch target, and the bet suggestions 34px. Those three pills sit side by side on a narrow screen, which is exactly where missing the target writes the wrong stake                                                                                                                             | Every screen using `.btn-ghost`, which is the shared class                                                                                                                                            | `min-h-11` on both, and the bet pills moved from `--hair` to `--edge` for the same reason as U-1                                                                                                                                                                                              |
| U-9 | Low      | `CalorieRing.tsx`, `Steps.tsx`                           | Step 3 reuses the daily-progress ring, full, to celebrate the freshly calculated target. Its caption is the dashboard's: "1.336 de 1.336 kcal", which says the person has already eaten their whole target before logging anything                                                                                                         | Everybody finishing onboarding. Cosmetic, but it is the screen that explains what the number means                                                                                                    | The ring takes a caption. Step 3 passes "kcal por dia"                                                                                                                                                                                                                                        |

### Verified and fine

| Check                                                 | How it was verified                                                                                                                                    | Date       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| Going back keeps what was typed                       | Walked it in the browser: typed the name, advanced, went back, and the field still read "Célia"                                                        | 2026-09-28 |
| Every field says what is missing, separately          | Submitted the form empty: five distinct messages, each next to its field ("Peso entre 20 e 500 kg.", "Escolhe o sexo.")                                | 2026-09-28 |
| An impossible weight is refused                       | 999 kg answered "Peso entre 20 e 500 kg."                                                                                                              | 2026-09-28 |
| A future birth date cannot be entered                 | `DateField` sets `max` to today, so the browser refuses it. Confirmed in the browser: the field stays empty                                            | 2026-09-28 |
| An invalid invite code does not advance the flow      | `POST /pair/join/XXXXXX` answers 404 and the screen says "Convite inválido". It was the announcement that was missing, not the check                   | 2026-09-28 |
| Somebody without a partner can finish                 | "Só eu por enquanto" reaches step 5 and then the dashboard                                                                                             | 2026-09-28 |
| The whole flow ends on the dashboard                  | Walked end to end in a browser on an iPhone 12: five steps, finished at `/dashboard`                                                                   | 2026-09-28 |
| No contrast, truncation or off-screen finding remains | The sweep tool measures every visible text against WCAG and every control against the 44px target across all five steps: zero findings after the fixes | 2026-09-28 |

## Tests

| Test                                 | Type | Risk it covers                                                                                                                                                                                  |
| ------------------------------------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Select.test.tsx` (8 cases)          | unit | U-5: opening with the arrows, moving and wrapping, Home and End, Enter choosing, Enter on an untouched list choosing nothing, Escape, opening on the current value, and the two aria attributes |
| `CalorieRing.test.tsx` (7 cases)     | unit | U-9 plus the ring's own arithmetic                                                                                                                                                              |
| `OnboardingPage.test.tsx` (existing) | unit | The step flow and the per-field messages                                                                                                                                                        |
| `e2e/onboarding.spec.ts` (2 cases)   | e2e  | A new account reaching the dashboard, and the form refusing to advance empty                                                                                                                    |

```bash
npm --prefix frontend exec -- vitest run src/components/ui/Select.test.tsx
npm --prefix frontend exec -- playwright test onboarding
```

### What is not covered

- **The keyboard path end to end.** `Select` is tested on its own; nothing walks the whole
  five-step flow with a keyboard only.
- **The invite code path.** No test enters a real code here; `e2e/pair.spec.ts` covers pairing
  from the pair screen instead.
- **The stake.** Step 5 writes it on the way out and no test reads it back.
- **The calculation itself.** The target comes from `GET /users/me/tdee`, covered on the
  backend; the screen is not asserted against a known profile.

## Known debt

| Item                                                                    | Impact                                                                                                         | When it is meant to be addressed |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `onboarding.themeToLight/Dark` and `header.light/dark` are now orphaned | Four unused keys across four languages. The parity test does not complain about unused keys, so nothing breaks | Next time either file is touched |
| `OnboardingPage.tsx` is 357 lines                                       | Above the 300-line lint warning, which is a warning here rather than an error                                  | If another step is added         |

## History

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                                        | Pull request |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 2026-10-13 | The target weight joined step 1, asked only of somebody chasing one. Without it the dashboard had no way to show progress: it showed today's weight and a line asking the person to weigh again, to somebody who had already weighed six days running. Walked end to end in a browser: the field appears on "lose weight", a contradicting target is refused on the screen, and a coherent one reaches the dashboard as a bar | pending      |
| 2026-09-28 | Screen-by-screen sweep: the combobox got its keyboard, the error message got announced, the three theme buttons became one, two touch targets reached 44px, and the target ring stopped claiming the person had eaten it all. Document created                                                                                                                                                                                | pending      |
