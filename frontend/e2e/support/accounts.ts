import { expect, type Page } from '@playwright/test'

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

/** Where the signed-in session is saved, so tests do not each register their own account. */
export const SESSION_FILE = 'e2e/.auth/session.json'

/** Where the shared account's credentials are saved, for the specs that sign in again. */
const ACCOUNT_FILE = 'e2e/.auth/account.json'

/**
 * The account the setup project registered.
 *
 * Written to disk rather than kept in a module variable, because Playwright runs each spec
 * file in its own worker process: a variable set during setup would be undefined
 * everywhere else.
 */
export function saveSharedAccount(account: { email: string; password: string }) {
  mkdirSync(dirname(ACCOUNT_FILE), { recursive: true })
  writeFileSync(ACCOUNT_FILE, JSON.stringify(account), 'utf8')
}

export function sharedAccount(): { email: string; password: string } {
  if (!existsSync(ACCOUNT_FILE)) {
    throw new Error('The setup project must run before the tests that reuse its account.')
  }
  return JSON.parse(readFileSync(ACCOUNT_FILE, 'utf8')) as { email: string; password: string }
}

/** A password that satisfies the backend's rules (8 to 100 characters). */
export const PASSWORD = 'Test@12345'

/**
 * An address nobody else is using.
 *
 * The tests run against a real database that is not reset between runs, so a fixed address
 * would work once and then collide with itself. This also keeps tests independent when
 * they run in parallel.
 */
export function uniqueEmail(prefix: string): string {
  const suffix = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${suffix}@e2e.vitalpair.app`
}

/**
 * Pins the interface language before anything is asserted.
 *
 * The application picks a language from the browser, and a test that matches text in four
 * languages at once is both unreadable and prone to matching the wrong control. Pinning it
 * makes every locator specific, and the language switch itself is covered by its own test.
 */
export async function withPortugueseUi(page: Page) {
  await page.addInitScript(() => window.localStorage.setItem('vitalpair-lang', 'pt'))
}

/** The three fields of the sign-up form, by the label a person reads. */
function registerFields(page: Page) {
  return {
    name: page.getByRole('textbox', { name: 'Como te chamam?' }),
    email: page.getByRole('textbox', { name: 'Email', exact: true }),
    password: page.getByLabel('Senha', { exact: true }),
    submit: page.getByRole('button', { name: /criar conta/i }),
  }
}

/**
 * Registers through the interface, exactly as a person would.
 *
 * Deliberately not a call to the API with the session written into storage: doing that
 * would skip the form, its validation and the redirect, which is most of what can break on
 * the way in.
 */
export async function registerThroughTheUi(
  page: Page,
  name: string,
): Promise<{ email: string; password: string }> {
  const email = uniqueEmail(name.toLowerCase())

  await withPortugueseUi(page)
  await page.goto('/register')
  const fields = registerFields(page)
  await fields.name.fill(name)
  await fields.email.fill(email)
  await fields.password.fill(PASSWORD)
  await fields.submit.click()

  // Registration ends on onboarding (new profile) or the dashboard; waiting here means a
  // caller never races against a redirect that has not happened yet.
  await expect(page).toHaveURL(/\/(onboarding|dashboard)/)

  return { email, password: PASSWORD }
}

/** Signs in through the form. Does not wait: use signIn when the test needs to be inside. */
export async function loginThroughTheUi(page: Page, email: string, password: string) {
  await withPortugueseUi(page)
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: /^entrar$/i }).click()
}

/**
 * Signs in as the shared account and waits until the application is actually usable.
 *
 * Waiting on the URL alone is not enough: the app renders a placeholder until the refresh
 * cookie has been exchanged for an access token, so a test that asserts immediately after
 * the redirect races that request. The sign-out control only exists once the layout is
 * mounted, which makes it a reliable signal that the session is live.
 */
export async function signIn(page: Page): Promise<{ email: string; password: string }> {
  const account = sharedAccount()
  await loginThroughTheUi(page, account.email, account.password)
  await expect(page.getByRole('button', { name: /sair/i })).toBeVisible()
  return account
}
