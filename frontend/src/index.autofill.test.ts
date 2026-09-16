import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * O campo preenchido pelo navegador tem de continuar parecendo um campo.
 *
 * O Chrome pinta o autopreenchimento com um amarelo-claro próprio e ignora
 * `background-color`, então no tema escuro o campo virava uma faixa branca com o texto quase
 * ilegível: exatamente o que aparecia ao escolher um e-mail salvo na tela de login.
 *
 * Lê o CSS de verdade, e não uma cópia, porque é o arquivo que o navegador carrega. Um teste
 * de componente não serviria: o jsdom não implementa `:-webkit-autofill`, então só a presença
 * das regras no stylesheet é verificável daqui.
 */
const CSS = readFileSync(join(__dirname, 'index.css'), 'utf8')

/** O bloco da regra de autopreenchimento, do seletor até a chave que o fecha. */
function autofillBlock(): string {
  const start = CSS.indexOf('input:-webkit-autofill')
  expect(start, 'a regra de -webkit-autofill sumiu do index.css').toBeGreaterThan(-1)
  const end = CSS.indexOf('}', start)
  return CSS.slice(start, end)
}

describe('autofill', () => {
  it('paints the field with an inset shadow, because the background is ignored', () => {
    // `box-shadow` é o único caminho: o Chrome sobrescreve `background-color` no
    // autopreenchimento, e é por isso que a cor entra como sombra interna do tamanho do campo.
    const block = autofillBlock()

    expect(block).toMatch(/-webkit-box-shadow:\s*0 0 0 1000px var\(--canvas\) inset/)
    expect(block).toMatch(/box-shadow:\s*0 0 0 1000px var\(--canvas\) inset/)
  })

  it('sets the text colour through text-fill-color, which is the one that applies', () => {
    // O `color` normal também é ignorado no autopreenchido, então sem isto o texto fica na
    // cor que o navegador escolher, que no tema escuro é preto sobre preto.
    expect(autofillBlock()).toMatch(/-webkit-text-fill-color:\s*var\(--ink\)/)
  })

  it('holds off the background transition so the white flash never lands', () => {
    // O Chrome reaplica o estilo dele no primeiro quadro. Adiar a transição de fundo por
    // tempo suficiente é o truque que impede o piscar branco entre o clique na sugestão e a
    // pintura do campo.
    expect(autofillBlock()).toMatch(/transition:\s*background-color 100000s/)
  })

  it('covers hover, focus and active, not just the resting state', () => {
    // O estado do autopreenchimento persiste: passar o mouse ou focar o campo depois de
    // escolher a sugestão devolveria o fundo do navegador se só o seletor base existisse.
    for (const state of ['hover', 'focus', 'active']) {
      expect(CSS, `falta input:-webkit-autofill:${state}`).toContain(
        `input:-webkit-autofill:${state}`,
      )
    }
  })

  it('uses the card colour for a field that sits on a card', () => {
    // Campo dentro de cartão tem fundo de superfície; sem esta regra o autopreenchido sairia
    // da cor do canvas e ficaria diferente dos campos vazios ao lado dele.
    expect(CSS).toMatch(/\.bg-surface:-webkit-autofill[\s\S]{0,200}var\(--surface\) inset/)
  })
})
