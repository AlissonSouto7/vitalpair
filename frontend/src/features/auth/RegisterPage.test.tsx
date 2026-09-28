import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { RegisterPage } from './RegisterPage'

import i18n from '@/i18n'
import { renderWithProviders } from '@/test/render'

/**
 * Creating an account, and what the screen says about the password on the way.
 *
 * The strength meter is the part worth testing: it is the only thing telling somebody whether
 * the password they just invented is any good, and it was saying the wrong thing in the most
 * convincing way available, which is colour.
 */
describe('RegisterPage', () => {
  async function digitarSenha(valor: string) {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)
    await user.type(screen.getByLabelText(i18n.t('auth.password')), valor)
    return user
  }

  it('says nothing about a password nobody has typed yet', () => {
    renderWithProviders(<RegisterPage />)

    // Quatro tracinhos cinzentos antes de a pessoa digitar qualquer coisa são ruído: não há
    // nada para avaliar ainda.
    expect(screen.queryByText(i18n.t('auth.strengthWeak'))).not.toBeInTheDocument()
    expect(screen.queryByText(i18n.t('auth.strengthStrong'))).not.toBeInTheDocument()
  })

  it('calls a weak password weak, in words and not only in colour', async () => {
    await digitarSenha('123')

    /*
     * Medido antes: as quatro barras eram todas `bg-success`, então "senha123" acendia duas
     * barras do mesmo verde de uma senha forte. Verde quer dizer aprovado no resto do produto,
     * e dá-lo a uma senha fraca é dizer que está bom quando não está.
     *
     * A palavra existe porque cor sozinha não é informação: quem não distingue vermelho de
     * verde vê quatro tracinhos iguais.
     */
    expect(screen.getByText(i18n.t('auth.strengthWeak'))).toBeInTheDocument()
  })

  it('lights a red bar for the worst password, instead of leaving all four grey', async () => {
    await digitarSenha('123')

    /*
     * Score 0 lit no bars at all, so a three-character password showed four grey dashes beside
     * the words "Senha fraca": the words said it was bad and the bars said nothing had been
     * judged, and red, the more visible of the two signals, never appeared. One red bar is the
     * worst result, not the absence of one.
     */
    const barras = screen
      .getByText(i18n.t('auth.strengthWeak'))
      .parentElement!.querySelectorAll('span')
    expect(barras).toHaveLength(4)
    expect(barras[0].className).toContain('bg-danger')
    expect(barras[1].className).toContain('bg-track')
  })

  it('reserves the strongest verdict for a password that earns it', async () => {
    await digitarSenha('Test@12345!Abc#2026')

    expect(screen.getByText(i18n.t('auth.strengthStrong'))).toBeInTheDocument()
  })

  it('does not call a middling password strong', async () => {
    // Oito caracteres com letra e número passam na validação e não são uma senha forte.
    await digitarSenha('senha123')

    expect(screen.queryByText(i18n.t('auth.strengthStrong'))).not.toBeInTheDocument()
    expect(screen.queryByText(i18n.t('auth.strengthWeak'))).not.toBeInTheDocument()
  })

  it('announces the verdict to somebody who cannot see the bars', async () => {
    await digitarSenha('Test@12345!Abc#2026')

    // `aria-live`: sem isso a mudança acontece em silêncio para quem usa leitor de tela, que é
    // exatamente quem não tem como ver a cor.
    expect(screen.getByText(i18n.t('auth.strengthStrong'))).toHaveAttribute('aria-live', 'polite')
  })
})
