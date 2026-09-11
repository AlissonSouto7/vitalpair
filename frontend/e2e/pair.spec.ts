import { expect, test, type Browser, type Page } from '@playwright/test'

import { partnerAccount, sharedAccount, withPortugueseUi } from './support/accounts'

/**
 * Two people becoming a pair.
 *
 * This is the only flow in the product that needs two accounts acting at once, which is
 * why it had no browser test: everything else can be driven from one session. It is also
 * the flow the whole product is built around, so "the invite code does not work" is the
 * one failure that makes the app pointless rather than merely broken.
 *
 * Each person gets their own browser context. Sharing one would share cookies, and the
 * second sign-in would silently replace the first person's session.
 *
 * Nobody registers here: both accounts come from setup, because registration is rate
 * limited to five a minute per address and the whole suite runs from one address. Signing
 * in is limited too, which is why all three checks live in one test rather than three: four
 * sign-ins would spend an allowance every other spec draws on, and something would fail at
 * random on a limit that is doing its job.
 *
 * Restoring a saved session instead was tried and is wrong here. The refresh token is
 * single-use with family reuse detection, so replaying one saved cookie in a second context
 * is theft as far as the backend is concerned, and it revokes the family. That is the
 * feature working; the test has to sign in properly.
 *
 * The pair is undone at the end, so a second run against the same database starts from the
 * same place instead of finding the accounts already paired.
 */

/**
 * Signs one person in, in a context of its own.
 *
 * Separate contexts are what let two people be on screen at once: one context means one
 * cookie jar, and the second person would replace the first.
 */
async function signedInAs(
  browser: Browser,
  account: { email: string; password: string },
): Promise<Page> {
  const context = await browser.newContext()
  const page = await context.newPage()
  await withPortugueseUi(page)
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(account.email)
  await page.getByLabel('Senha', { exact: true }).fill(account.password)
  await page.getByRole('button', { name: /^entrar$/i }).click()
  await expect(page).toHaveURL(/\/(onboarding|dashboard)/)
  return page
}

test.describe('forming a pair', () => {
  test('one person invites, the other joins with the code', async ({ browser }) => {
    const inviter = await signedInAs(browser, sharedAccount())
    const joiner = await signedInAs(browser, partnerAccount())

    // The inviter's own code, read off the screen the way a person reads it before sending
    // it to someone. Reading it from the API instead would not prove the screen shows it.
    // It is displayed as text next to the copy button, not in a field.
    await inviter.goto('/pair')
    const code = (
      await inviter
        .getByRole('heading', { name: /manda esse código/i })
        .locator('..')
        .getByText(/^[A-Z0-9]{8}$/)
        .innerText()
    ).trim()
    expect(code).toMatch(/^[A-Z0-9]{8}$/)

    await joiner.goto('/pair')
    await joiner.getByPlaceholder('ABCD2345').fill(code)
    await joiner.getByRole('button', { name: /entrar na dupla/i }).click()

    // Both sides have to agree the pair exists. Only checking the joiner would pass with a
    // backend that formed a pair the inviter never sees.
    await expect(joiner.getByText(/dupla formada|tá valendo/i).first()).toBeVisible({
      timeout: 15000,
    })
    await inviter.reload()
    await expect(inviter.getByText(/dupla formada|tá valendo/i).first()).toBeVisible({
      timeout: 15000,
    })

    // Left again, so the shared account is solo for the next run. Without this the suite
    // passes once and then fails on a second run against the same database, which is the
    // worst kind of test: green today, mysteriously red tomorrow.
    await inviter.getByRole('button', { name: /encerrar a dupla/i }).click()
    await inviter.getByRole('button', { name: /isso, encerrar/i }).click()
    await expect(inviter.getByText(/manda esse código/i)).toBeVisible({ timeout: 15000 })

    // Two more checks on the same sessions rather than two more tests, because each test
    // would pay for its own sign-ins against a limit the whole suite shares.

    // Right shape, wrong code: the screen's own validation cannot catch this one, so the
    // server has to, and the person has to be told rather than left on a spinner.
    await inviter.getByPlaceholder('ABCD2345').fill('ZZZZ9999')
    await inviter.getByRole('button', { name: /entrar na dupla/i }).click()
    await expect(inviter.getByRole('alert').first()).toBeVisible({ timeout: 15000 })

    // The link someone pastes out of a message. A dead one is worth checking because the
    // page fetches on mount and used to have nowhere to put a failure.
    await inviter.goto('/invite/ZZZZ9999')
    await expect(inviter.getByText(/convite não encontrado|não colou/i).first()).toBeVisible({
      timeout: 15000,
    })

    await inviter.context().close()
    await joiner.context().close()
  })
})
