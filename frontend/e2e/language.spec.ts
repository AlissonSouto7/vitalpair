import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

import { signInWithoutPinningLanguage } from './support/accounts'

/**
 * Os três idiomas além do português, com o que cada um tem de próprio.
 *
 * `confirm` é o nome acessível que o seletor passa a ter depois da troca, e serve de espera:
 * é o sinal de que o bundle novo já está na tela. Os outros campos são texto que o servidor
 * manda em pt-BR e que o cliente traduz pelo código, que é o que se quer provar.
 */
const LANGUAGES = [
  {
    code: 'en',
    option: /english/i,
    confirm: /app language: english/i,
    badge: 'First meal',
    // A semanal, e não a relâmpago: esta é sorteada por dia, e prender o teste a uma delas
    // o faz falhar na virada da data sem que nada tenha quebrado.
    mission: 'Log meals on 5 days',
    stake: 'Loser buys dinner',
  },
  {
    code: 'es',
    option: /español/i,
    confirm: /idioma de la app: español/i,
    badge: 'Primera comida',
    mission: 'Registra comidas 5 días',
    stake: 'El que pierde paga la cena',
  },
  {
    code: 'fr',
    option: /français/i,
    confirm: /langue de l.app\s*: français/i,
    badge: 'Premier repas',
    mission: 'Enregistre tes repas 5 jours',
    stake: 'Le perdant paie le dîner',
  },
] as const

/** Troca de idioma pelo seletor, como a pessoa faz, e espera a tela já traduzida. */
async function switchTo(page: Page, lang: (typeof LANGUAGES)[number]) {
  await page.goto('/settings')
  await page.getByRole('button', { name: /idioma do app: português/i }).click()
  await page.getByRole('menuitemradio', { name: lang.option }).click()
  await expect(page.getByRole('button', { name: lang.confirm })).toBeVisible()
}

const EN = LANGUAGES[0]

/** O caminho mais percorrido, e por isso o que os testes gerais usam. */
async function switchToEnglish(page: Page) {
  await switchTo(page, EN)
}

/**
 * Trocar o idioma da aplicação, do jeito que uma pessoa troca.
 *
 * É o único teste que exercita a tradução ponta a ponta: os testes de componente provam que
 * uma tela traduz quando o i18n muda, mas nenhum deles passa pelo seletor real, pelo bundle
 * de produção, nem prova que a escolha sobrevive a um reload. E a falha que motivou tudo
 * isso é justamente de ponta a ponta: catálogo gravado em pt-BR no banco (medalhas,
 * missões, aposta padrão) aparecendo no meio de uma tela em inglês.
 */
test.describe('language', () => {
  /*
    Locale fixo no contexto do navegador. Sem ele, o idioma de abertura viria do sistema de
    quem roda a suíte (o detector cai em `navigator` quando o localStorage está vazio), e o
    teste passaria nesta máquina e falharia num CI configurado em inglês.
  */
  test.use({ locale: 'pt-BR' })

  test('switching the language translates the app and sticks across a reload', async ({ page }) => {
    // Sem fixar o idioma: o addInitScript que o signIn instala reescreveria a escolha no
    // reload, e é exatamente a persistência que este teste mede.
    await signInWithoutPinningLanguage(page)
    await page.goto('/settings')

    // Pelo nome acessível, que diz a função e o valor atual: é assim que o botão se
    // anuncia para quem usa leitor de tela, e não muda quando a bandeira ou o código mudam.
    await page.getByRole('button', { name: /idioma do app: português/i }).click()
    await page.getByRole('menuitemradio', { name: /english/i }).click()

    await expect(page.getByRole('button', { name: /app language: english/i })).toBeVisible()

    /*
      A escolha sobrevive ao reload, porque é gravada em localStorage sob 'vitalpair-lang'.

      Por isso o login aqui é o que não fixa o idioma: o addInitScript do `signIn` roda a
      cada carregamento, então no reload ele devolveria 'pt' e o teste mediria o próprio
      andaime em vez da persistência do app.
    */
    await page.reload()
    await expect(page.getByRole('button', { name: /app language: english/i })).toBeVisible()
  })

  test('server-sent catalogue text follows the interface language', async ({ page }) => {
    // O coração da correção. Medalhas, missões e a aposta padrão chegam do backend em
    // pt-BR, gravadas nas migrations V6, V13 e V15, e eram exibidas cruas. Aqui as três
    // passam pelo servidor de verdade e pelo build de produção, que é onde um erro de
    // bundle das chaves novas apareceria.
    await signInWithoutPinningLanguage(page)
    await switchToEnglish(page)

    // `exact`: o nome da medalha é prefixo da própria descrição ("First meal" dentro de
    // "Logged your first meal" não, mas "Log 3 meals today" e outros pares casam por
    // substring), e um seletor frouxo passaria por acidente ao encontrar o texto errado.
    await page.goto('/gamification')
    await expect(page.getByText('First meal', { exact: true })).toBeVisible()
    await expect(page.getByText('Logged your first meal', { exact: true })).toBeVisible()
    await expect(page.getByText('Primeira refeição', { exact: true })).toHaveCount(0)

    await page.goto('/missions')
    await expect(page.getByText('Log meals on 5 days', { exact: true })).toBeVisible()
    await expect(page.getByText('Train 3x this week', { exact: true })).toBeVisible()
    await expect(page.getByText('Registre refeições em 5 dias', { exact: true })).toHaveCount(0)

    await page.goto('/season')
    await expect(page.getByText('Loser buys dinner', { exact: true })).toBeVisible()
    await expect(page.getByText('Quem perder paga o jantar', { exact: true })).toHaveCount(0)
  })

  test('no screen shows a raw translation key in any language', async ({ page }) => {
    // Uma chave crua na tela ("missions.mission.X.title") é o modo como uma tradução
    // faltante se manifesta para o usuário, e passaria despercebida por qualquer teste que
    // só verifique que a página carregou.
    await signInWithoutPinningLanguage(page)
    await switchToEnglish(page)

    for (const route of ['/dashboard', '/nutrition', '/missions', '/gamification', '/season']) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      // Os namespaces reais do bundle, e não um padrão genérico com ponto: um preço como
      // "R$ 7,90" ou uma data casariam com qualquer coisa mais frouxa.
      await expect(page.locator('body')).not.toContainText(
        /\b(missions|gamification|season|dashboard|nutrition|common)\.[a-zA-Z]+\./,
      )
    }
  })

  for (const lang of LANGUAGES) {
    test(`catalogue text reaches the screen in ${lang.code}`, async ({ page }) => {
      // Um por idioma, e não um teste só com um laço dentro: assim a falha diz qual idioma
      // quebrou, em vez de apontar para a primeira asserção de uma sequência.
      await signInWithoutPinningLanguage(page)
      await switchTo(page, lang)

      await page.goto('/gamification')
      await expect(page.getByText(lang.badge, { exact: true })).toBeVisible()

      await page.goto('/missions')
      await expect(page.getByText(lang.mission, { exact: true })).toBeVisible()

      await page.goto('/season')
      await expect(page.getByText(lang.stake, { exact: true })).toBeVisible()

      // O texto em português não pode sobrar em canto nenhum das três telas.
      await expect(page.getByText('Quem perder paga o jantar', { exact: true })).toHaveCount(0)
    })
  }
})
