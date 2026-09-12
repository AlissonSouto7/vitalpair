import { expect, test } from '@playwright/test'

import { signIn, withPortugueseUi } from './support/accounts'

/**
 * Every form control can be found by its label.
 *
 * This is not a checklist item: a control whose label is not attached to it is announced
 * by a screen reader as an unnamed edit box, and clicking the label does not focus it. The
 * defect existed on every form in this application and went unnoticed for months, because
 * it looks perfectly normal to someone who can see the page.
 *
 * The assertion is deliberately mechanical rather than a full audit: a real accessibility
 * review needs a person. What this catches is the regression, which is the part a test can
 * do well.
 */

/** Controls that legitimately have no visible label, with the reason. */
const EXEMPT = [
  // The search box carries its purpose in a placeholder and a submit button beside it.
  'input[type="search"]',
  // Hidden inputs and file pickers behind a styled button.
  'input[type="hidden"]',
  'input[type="file"]',
]

/**
 * Waits for the screen to actually render its form.
 *
 * Routes are code-split, so a page briefly shows only a placeholder. Checking then finds no
 * controls at all and passes for the wrong reason: the first version of this test did
 * exactly that, and an unlabelled input added on purpose did not fail it.
 */
async function waitForForm(page: import('@playwright/test').Page) {
  // Attached rather than visible: some screens keep a control behind a tab or a collapsed
  // panel, and a hidden control still needs its label. What matters is that the route's
  // code has arrived, so the placeholder is gone and the DOM is the real page.
  //
  // Thirty seconds rather than the default ten. This test walks five routes in one case,
  // each of them a separate chunk fetched on arrival, and the default was enough on a
  // developer machine (the whole file runs in eleven seconds) while failing on a shared
  // CI runner that had just built the bundle and started a JVM. The wait is not the thing
  // being measured here, so it should not be the thing that fails.
  await expect(page.locator('input, select, textarea').first()).toBeAttached({ timeout: 30_000 })
}

async function unlabelledControls(page: import('@playwright/test').Page) {
  return page.evaluate((exempt) => {
    const controls = Array.from(document.querySelectorAll('input, select, textarea'))
    return controls
      .filter((el) => !exempt.some((selector) => el.matches(selector)))
      .filter((el) => {
        const id = el.getAttribute('id')
        // A wrapping <label> is as valid as htmlFor: both associate the control.
        if (el.closest('label')) return false
        if (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) return false
        if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return false
        return true
      })
      .map((el) => {
        const type = el.getAttribute('type') ?? el.tagName.toLowerCase()
        return `${type}${el.getAttribute('name') ? `[name=${el.getAttribute('name')}]` : ''}`
      })
  }, EXEMPT)
}

test.describe('form controls are labelled', () => {
  test('on the sign-in and sign-up screens', async ({ page }) => {
    for (const route of ['/login', '/register', '/forgot-password']) {
      await withPortugueseUi(page)
      await page.goto(route)
      await waitForForm(page)
      expect(await unlabelledControls(page), `${route} has controls without a label`).toEqual([])
    }
  })

  test('on the screens behind the login', async ({ page }) => {
    await signIn(page)

    for (const route of ['/profile', '/activity', '/nutrition', '/progress', '/pair']) {
      await page.goto(route)
      await waitForForm(page)
      expect(await unlabelledControls(page), `${route} has controls without a label`).toEqual([])
    }
  })
})
