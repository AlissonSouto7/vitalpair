import { expect, test } from '@playwright/test'

import { withPortugueseUi } from './support/accounts'

/**
 * What a person sees when the server itself fails.
 *
 * The unit test proves the interceptor decides to notify; it mocks sonner, so it cannot
 * prove anything reaches the screen. A Toaster that was mounted but never fed would pass
 * that test and show nothing here, which is exactly the state this suite found the app in.
 */
test('a 500 shows a toast carrying the request id', async ({ page }) => {
  await withPortugueseUi(page)
  // Forces the failure the interceptor is meant to notice, with the envelope the backend
  // really sends, so the id has somewhere to come from.
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        message: 'Erro interno inesperado',
        data: { status: 500, requestId: 'prova-1234' },
      }),
    }),
  )
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('quem@example.com')
  await page.getByLabel('Senha', { exact: true }).fill('Test@12345')
  await page.getByRole('button', { name: /entrar/i }).click()

  await expect(page.getByText(/deu ruim do nosso lado/i)).toBeVisible()
  await expect(page.getByText(/prova-1234/)).toBeVisible()
})
