import { expect, test as setup } from '@playwright/test'

import {
  registerThroughTheUi,
  savePartnerAccount,
  saveSharedAccount,
  SESSION_FILE,
} from './accounts'

/**
 * Creates the one account the rest of the suite signs in as, and saves its session.
 *
 * Registration is rate-limited to five a minute per address, on purpose, and the whole
 * suite runs from one address: a test file that registers its own account competes for
 * that allowance with every other file and fails at random. Registering once here, before
 * anything else runs, removes the competition without weakening the limit.
 *
 * The act of registering is still covered, by the tests in auth.spec.ts that need a fresh
 * account; those are few enough to stay within the allowance.
 */
setup('create the shared account', async ({ page }) => {
  const account = await registerThroughTheUi(page, 'Suite')
  saveSharedAccount(account)

  // The saved state is the cookie plus what the app keeps in storage, which is what lets
  // another test start already signed in without paying for another registration.
  await page.context().storageState({ path: SESSION_FILE })
  await expect(page).toHaveURL(/\/(onboarding|dashboard)/)
})

/**
 * The partner account, for the pairing flow.
 *
 * Two accounts is the minimum that flow can be tested with, and registering the second one
 * inside the spec spent an allowance the registration tests need. Registered here once, in
 * its own context so it does not overwrite the session saved above.
 */
setup('create the partner account', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  savePartnerAccount(await registerThroughTheUi(page, 'Parceiro'))
  await context.close()
})
