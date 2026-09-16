import { expect, test } from '@playwright/test'

/**
 * A página pública, que é a única tela que um estranho vê antes de decidir.
 *
 * Nenhum teste passava por ela: a suíte entrava direto no app. Os defeitos que isso deixou
 * escapar são todos de página de marketing, e não de aplicação: uma âncora que para atrás
 * da barra fixa, uma coluna que não empilha no telefone, uma seção inteira que não existe.
 */
test.describe('landing', () => {
  test.use({ locale: 'pt-BR' })

  test('shows the whole pitch, from the promise to the price', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // As cinco seções na ordem em que convencem: o que é, como funciona, a prova, o preço,
    // e as objeções antes do fechamento.
    for (const heading of [
      'Na real, é bem de boa',
      'Dispute com quem você quiser',
      'O jogo inteiro é de graça',
      'Antes que você desista por causa disso',
    ]) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    }
  })

  test('the scoreboard plays by itself', async ({ page }) => {
    // A vitrine é o placar se movendo: é o que mostra o produto em vez de descrevê-lo.
    await page.goto('/')

    // Pelos dois lados genéricos: o lado azul dizia "Alisson", que é o nome de outra pessoa
    // para quem abre a página.
    const board = page.getByText('Você', { exact: true }).first()
    await expect(board).toBeVisible()

    const first = await page.locator('[class*="text-[40px]"]').first().innerText()
    // O roteiro anda a cada 2,8s; um passo basta para provar que não é uma imagem parada.
    await expect(async () => {
      const now = await page.locator('[class*="text-[40px]"]').first().innerText()
      expect(now).not.toBe(first)
    }).toPass({ timeout: 12_000 })
  })

  test('the top bar follows the page down and its links land below it', async ({ page }) => {
    // A página é longa e o "Começar grátis" é o que a pessoa veio fazer, então a decisão
    // precisa continuar ao alcance depois do preço. E sem scroll-padding a âncora para com
    // o título escondido atrás da própria barra.
    await page.goto('/')
    await page.getByRole('link', { name: 'Preço', exact: true }).first().click()

    const bar = page.locator('nav').first()
    await expect(bar).toBeInViewport()

    const title = page.getByRole('heading', { name: 'O jogo inteiro é de graça' })
    await expect(title).toBeInViewport()

    /*
      O título tem de ficar abaixo da barra com folga, e não raspando nela.

      Medido em 15/09/2026: sem o scroll-padding no html o título para a 18px do fim da
      barra, o que já passaria por um `y > fim da barra` e ainda assim parece colado. Com o
      ajuste, são 102px. O limite de 40px reprova a versão sem o ajuste sem prender o teste
      ao valor exato do padding.
    */
    const barBox = (await bar.boundingBox())!
    const titleBox = (await title.boundingBox())!
    expect(titleBox.y - (barBox.y + barBox.height)).toBeGreaterThan(40)
  })

  test('stacks into one column on a phone, with nothing running off the side', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 })
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })

  test('prices both plans, and says the paid one covers two people', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('R$ 0', { exact: true })).toBeVisible()
    await expect(page.getByText('R$ 14', { exact: true })).toBeVisible()
    await expect(page.getByText('cobre vocês dois', { exact: true })).toBeVisible()
  })
})
