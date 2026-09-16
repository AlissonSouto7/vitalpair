import { expect, test } from '@playwright/test'

import { registerThroughTheUi, withPortugueseUi } from './support/accounts'

test.describe('logging a meal', () => {
  test('a meal logged by hand shows on the day and moves the totals', async ({ page }) => {
    // Its own account rather than the shared one: this test asserts on the day's totals,
    // and a shared account accumulates whatever other tests logged.
    // Pelo helper, e não com uma cópia do formulário aqui: ele também preenche o perfil,
    // sem o qual o roteador manda a conta nova para o onboarding e esta tela nunca abre.
    await withPortugueseUi(page)
    await registerThroughTheUi(page, 'Refeicao')

    await page.goto('/nutrition')
    await page.getByRole('button', { name: /buscar/i }).click()

    // The manual entry, which needs no external food database and is therefore the part
    // that must keep working when Open Food Facts is down.
    await page.getByRole('button', { name: /não achei, vou colocar na mão/i }).click()

    await page.getByLabel('O que foi').fill('Arroz com feijão')
    await page.getByLabel('kcal /100g').fill('130')
    await page.getByLabel('Gramas').fill('200')

    // 130 kcal per 100 g over 200 g. The bar only appears once the page has worked the
    // total out, so seeing it is the proof the arithmetic ran on what was typed.
    await expect(page.getByText('260 kcal', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: /registrar/i }).click()

    // On the day's list, which is the read path: a 201 nobody reads back proves less. This
    // is what caught the day-boundary bug: the meal saved, and the list came back empty
    // because the server's idea of "today" and the window it queried were in different
    // zones. Between 21:00 and midnight in Brazil, a meal vanished as it was logged.
    await expect(page.getByText('Arroz com feijão')).toBeVisible({ timeout: 15000 })

    // And the dashboard agrees, which is what the cache invalidation is for. A stale
    // dashboard after logging was the bug this asserts against.
    await page.goto('/dashboard')
    await expect(page.getByText(/kcal/i).first()).toBeVisible()
  })
})
