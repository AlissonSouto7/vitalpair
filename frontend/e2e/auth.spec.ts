import { expect, test } from '@playwright/test'

import {
  loginThroughTheUi,
  PASSWORD,
  registerThroughTheUi,
  sharedAccount,
  signIn,
  uniqueEmail,
  withPortugueseUi,
} from './support/accounts'

/**
 * Getting into the application, the way a person does it.
 *
 * Every step here crosses the real stack: the built bundle, the proxy, the API, Postgres
 * and Redis. The backend suite proves the endpoints are right and the component tests
 * prove a widget behaves; neither notices a form that posts to the wrong route, a session
 * that ends on reload, or a button that never becomes clickable.
 */
test.describe('signing in', () => {
  test('a new account can register and lands inside the app', async ({ page }) => {
    // registerThroughTheUi already waits for the redirect, which is the assertion:
    // it fails if the form does not take the person into the application.
    const { email } = await registerThroughTheUi(page, 'Iris')

    expect(email).toContain('@e2e.vitalpair.app')
  })

  test('a registered account can sign out and sign back in', async ({ page }) => {
    // Uses the account the setup project created: this test is about signing out and back
    // in, and registration is rate-limited to five a minute from one address on purpose.
    // signIn already leaves the app in a usable state; navigating again would restart the
    // session bootstrap and briefly remove the control this test clicks.
    const { email } = await signIn(page)

    await page.getByRole('button', { name: /sair/i }).click()
    await expect(page).toHaveURL(/\/(login|$)/)

    await loginThroughTheUi(page, email, PASSWORD)
    await expect(page).toHaveURL(/\/(onboarding|dashboard)/)
  })

  test('the session survives a reload', async ({ page }) => {
    await signIn(page)
    await expect(page).toHaveURL(/\/(onboarding|dashboard)/)
    const before = page.url()

    await page.reload()

    // The access token lives in memory only, so this works solely because the refresh
    // cookie is exchanged on startup. A regression here logs everyone out on every reload
    // and would be invisible to any test that does not use a real browser.
    await expect(page).toHaveURL(before)
    await expect(page.getByRole('button', { name: /sair/i })).toBeVisible()
  })

  test('wrong credentials show a message and keep the user on the form', async ({ page }) => {
    await withPortugueseUi(page)
    await page.goto('/login')
    const { email } = sharedAccount()

    await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email)
    await page.getByLabel('Senha', { exact: true }).fill('wrong-password')
    await page.getByRole('button', { name: /^entrar$/i }).click()

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('an invalid e-mail is caught before the request is sent', async ({ page }) => {
    await withPortugueseUi(page)
    await page.goto('/login')
    let requests = 0
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/auth/login')) requests++
    })

    await page.getByRole('textbox', { name: 'Email', exact: true }).fill('not-an-email')
    await page.getByLabel('Senha', { exact: true }).fill(PASSWORD)
    await page.getByRole('button', { name: /^entrar$/i }).click()

    await expect(page.getByRole('alert')).toBeVisible()
    expect(requests, 'a form that cannot be valid should not reach the server').toBe(0)
  })

  test('a protected route sends an anonymous visitor to the login page', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/login/)
  })

  test('signing in with an account that does not exist fails safely', async ({ page }) => {
    await loginThroughTheUi(page, uniqueEmail('ghost'), PASSWORD)

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })
})
