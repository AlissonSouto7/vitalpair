import { expect, test } from '@playwright/test'

import { signIn } from './support/accounts'

/**
 * Moving around the application.
 *
 * These are the tests that notice a route whose code fails to load, which is exactly the
 * failure the per-route splitting introduced: a page that worked as part of one bundle can
 * fail on its own, and nothing but opening it would show that.
 */
test.describe('navigation', () => {
  test('an unknown path shows a real 404, not a silent redirect', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')

    await expect(page.getByText('404')).toBeVisible()
    // The path stays: redirecting to the dashboard hid broken links behind what looked
    // like a working page.
    await expect(page).toHaveURL(/this-page-does-not-exist/)
  })

  test('the legal pages render text, not translation keys', async ({ page }) => {
    // Their strings are fetched separately from the main bundle, so a mistake here shows
    // as raw identifiers on screen. That is precisely how one was caught during phase 9.
    await page.goto('/terms')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('body')).not.toContainText('legal.terms')
  })

  test('every authenticated screen loads its own chunk and renders', async ({ page }) => {
    // Signs in as the account the setup project registered: this test is about the screens
    // loading, not about signing up, and registration is rate-limited on purpose.
    await signIn(page)

    const routes = [
      '/dashboard',
      '/nutrition',
      '/activity',
      '/feed',
      '/meal-plan',
      '/workout-plan',
      '/season',
      '/missions',
      '/progress',
      '/gamification',
      '/pair',
      '/profile',
      '/settings',
    ]

    const failures: string[] = []
    page.on('pageerror', (error) => failures.push(error.message))
    const refused: string[] = []
    const refreshes: number[] = []
    page.on('response', (response) => {
      if (response.url().includes('/api/') && response.status() >= 400) {
        refused.push(`${response.status()} ${new URL(response.url()).pathname}`)
      }
      if (response.url().includes('/auth/refresh')) {
        refreshes.push(response.status())
      }
    })

    for (const route of routes) {
      // Navigating inside the app rather than reloading: page.goto restarts the
      // application on every route, and each restart exchanges the refresh cookie again.
      // Thirty of those a minute is the documented limit, and the walk plus the other
      // tests exceeded it, which logged the session out halfway through.
      await page.evaluate((path) => window.history.pushState({}, '', path), route)
      await page.evaluate(() => window.dispatchEvent(new PopStateEvent('popstate')))
      await expect(
        page,
        `${route} should not redirect away (API errors: ${refused.join(', ') || 'none'}; refreshes: ${refreshes.join(',')})`,
      ).toHaveURL(new RegExp(route))
      // A chunk that fails to load leaves the placeholder on screen forever, so the
      // assertion is that the placeholder is gone: "not empty" would also pass for a page
      // still loading, and some screens legitimately render an empty state.
      await expect(page.getByText(/carregando/i)).toHaveCount(0)
    }

    expect(failures, 'no screen may throw while rendering').toEqual([])
  })

  test('switching language changes the interface', async ({ page }) => {
    // The stored preference is what the app reads on startup, so setting it and reloading
    // is the same path a person takes through the language selector.
    await page.goto('/login')
    await page.evaluate(() => window.localStorage.setItem('vitalpair-lang', 'pt'))
    await page.reload()
    await expect(page.getByRole('button', { name: /^entrar$/i })).toBeVisible()

    await page.evaluate(() => window.localStorage.setItem('vitalpair-lang', 'fr'))
    await page.reload()

    await expect(page.getByRole('button', { name: /connexion|se connecter/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^entrar$/i })).toHaveCount(0)
  })
})
