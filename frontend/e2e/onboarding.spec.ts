import { expect, test, type Locator, type Page } from '@playwright/test'

import { registerThroughTheUi } from './support/accounts'

/**
 * The first five minutes of a new account, end to end.
 *
 * Nothing covered this before. The component tests prove a field validates and the backend
 * tests prove an endpoint stores what it is given; neither notices that the five-step form
 * cannot be completed, that the targets it computes never reach the dashboard, or that a
 * person who finishes onboarding lands somewhere broken. This is the path every single
 * user walks exactly once, and until it existed the only thing checking it was somebody
 * trying it by hand.
 */

/**
 * Picks a value from one of the styled dropdowns.
 *
 * They are buttons and a list rather than a native select, so a person opens one and
 * clicks a row. The row is a button inside the option, which is why the click targets the
 * button rather than the option.
 *
 * The list is scoped to the dropdown that owns it, which mattered when three date
 * dropdowns sat side by side with overlapping options; the date is a native field now and
 * only the sex dropdown is left, but scoping costs nothing and keeps the helper correct if
 * another one appears. The assertion at the end is what makes it honest, since clicking a
 * row that is on its way out of the DOM succeeds without selecting anything.
 */
async function chooseFrom(trigger: Locator, option: string) {
  const dropdown = trigger.locator('..')
  await trigger.click()
  await dropdown.getByRole('option', { name: option, exact: true }).getByRole('button').click()
  await expect(trigger).toHaveText(new RegExp(option))
}

/** Fills the "about you" step. The values are ordinary on purpose: nothing here is an edge case. */
async function fillAboutYou(page: Page, name: string) {
  /*
   * `fill` e não `type`: o campo já vem com o nome que a pessoa deu no cadastro, lido do
   * perfil, e digitar por cima acrescentaria ao que está lá. Perguntar o nome de novo, dez
   * segundos depois, era a primeira coisa que o app fazia.
   */
  await expect(page.getByLabel('Como te chamam?')).toHaveValue(name)
  await page.getByLabel('Como te chamam?').fill(name)
  await page.getByLabel('Peso').fill('78')
  await page.getByLabel('Altura').fill('179')

  /*
   * A data é o seletor nativo do aparelho, não três dropdowns. Eram 1044px de rolagem com o
   * dedo dentro de um popup de 240px para achar um ano na lista de 120.
   */
  await page.getByLabel('Nascimento').fill('1995-05-15')

  await chooseFrom(page.getByRole('combobox', { name: 'Sexo' }), 'Masculino')

  // The goal is on this step too, and step 1 does not advance without it.
  await page.getByRole('button', { name: /perder peso/i }).click()
}

test.describe('onboarding', () => {
  test('a new account can go through onboarding and reach the dashboard', async ({ page }) => {
    await registerThroughTheUi(page, 'Novato', { profile: 'empty' })
    await expect(page).toHaveURL(/\/onboarding/)

    await fillAboutYou(page, 'Novato')
    await page.getByRole('button', { name: /continuar/i }).click()

    // Routine: how active the person is. Leaving this step is what asks the server to
    // compute the targets.
    await page.getByRole('button', { name: /ativo de verdade/i }).click()
    await page.getByRole('button', { name: /tá bom pra mim/i }).click()

    // The result the server computed from the two steps above.
    await expect(page.getByText(/tá pronto/i)).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: /bora pro placar/i }).click()

    // Partner: solo, because pairing needs a second account and has its own test.
    await page.getByRole('button', { name: /só eu por enquanto/i }).click()
    await page.getByRole('button', { name: /continuar/i }).click()

    // The stake, then finish.
    await page.getByRole('button', { name: /começar a temporada/i }).click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
    // The dashboard rendering with a calorie target is the proof the profile was saved and
    // the server computed from it: an onboarding that "finished" without persisting would
    // land here with nothing.
    await expect(page.getByText(/kcal/i).first()).toBeVisible()
  })

  test('onboarding refuses to advance with the form empty', async ({ page }) => {
    await registerThroughTheUi(page, 'Apressado', { profile: 'empty' })
    await expect(page).toHaveURL(/\/onboarding/)

    // O nome chega preenchido do cadastro, então apagar é o que deixa o formulário
    // realmente vazio, que é o caso deste teste.
    await expect(page.getByLabel('Como te chamam?')).toHaveValue('Apressado')
    await page.getByLabel('Como te chamam?').fill('')

    await page.getByRole('button', { name: /continuar/i }).click()

    // Still on the first step, with a reason on screen rather than a silent no-op: the
    // summary, and a message next to each field saying what is missing.
    await expect(page.getByText(/preenche tudo aí em cima/i)).toBeVisible()
    await expect(page.getByText('Escolhe qual é seu foco agora.')).toBeVisible()
    await expect(page.getByLabel('Como te chamam?')).toBeVisible()
    await expect(page.getByLabel('Como te chamam?')).toHaveAttribute('aria-invalid', 'true')
  })
})
