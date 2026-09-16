import { act, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Duvidas, Preco } from './commerce'

import i18n from '@/i18n'
import { renderWithProviders } from '@/test/render'

afterEach(async () => {
  await i18n.changeLanguage('pt')
})

describe('Preço', () => {
  it('lists the free plan in full, including what it does not have', () => {
    // A promessa da página é que o jogo não custa nada. Um plano gratuito resumido ao lado
    // do pago faria essa promessa parecer isca, e omitir o limite é o que faz alguém se
    // sentir enganado depois de criar a conta.
    renderWithProviders(<Preco />)

    expect(screen.getByText('R$ 0')).toBeInTheDocument()
    expect(
      screen.getByText('A dupla, o placar ao vivo e a temporada de 30 dias'),
    ).toBeInTheDocument()
    expect(screen.getByText('Foto do prato, 3 por semana')).toBeInTheDocument()

    // O que falta aparece como falta, com o traço, e não some da lista.
    const missing = screen.getByText('Cardápio e treino da semana')
    expect(missing.closest('li')).toHaveTextContent('–')
  })

  it('says the paid plan covers both people, which is the whole offer', () => {
    // R$ 14 cobrindo a dupla é a decisão de preço do produto: se a página não disser isso,
    // o número parece o dobro do que é.
    renderWithProviders(<Preco />)

    expect(screen.getByText('R$ 14')).toBeInTheDocument()
    expect(screen.getByText('cobre vocês dois')).toBeInTheDocument()
    expect(screen.getByText('Seu par usa junto, sem pagar nada')).toBeInTheDocument()
  })

  it('sends both plans to the same place, because both start free', () => {
    const { container } = renderWithProviders(<Preco />)
    const links = [...container.querySelectorAll('a')]

    expect(links).toHaveLength(2)
    expect(links.every((a) => a.getAttribute('href') === '/register')).toBe(true)
  })

  it('translates the whole section, prices included', async () => {
    renderWithProviders(<Preco />)

    await act(async () => {
      await i18n.changeLanguage('en')
    })

    expect(screen.getByText('The whole game is free')).toBeInTheDocument()
    expect(screen.getByText('covers both of you')).toBeInTheDocument()
    // O preço fica em real nos quatro idiomas: é onde o produto cobra, e converter na
    // página daria um número que ninguém vai ver na fatura.
    expect(screen.getByText('R$ 14')).toBeInTheDocument()
  })
})

describe('Dúvidas', () => {
  it('answers the four objections that close the tab', () => {
    renderWithProviders(<Duvidas />)

    const asked = screen.getAllByRole('heading', { level: 3 })
    expect(asked).toHaveLength(4)
    expect(asked[0]).toHaveTextContent('E se eu não tiver com quem jogar?')
  })

  it('pairs each question with its own answer', () => {
    // Um laço que renderizasse pergunta e resposta de índices diferentes passaria por
    // qualquer teste que só contasse elementos.
    renderWithProviders(<Duvidas />)

    const card = screen
      .getByRole('heading', { name: 'Preciso pesar tudo que como?' })
      .closest('div') as HTMLElement
    expect(within(card).getByText(/o app faz a conta/)).toBeInTheDocument()
  })

  it('translates the questions and the answers together', async () => {
    renderWithProviders(<Duvidas />)

    await act(async () => {
      await i18n.changeLanguage('fr')
    })

    const card = screen
      .getByRole('heading', { name: /personne avec qui jouer/i })
      .closest('div') as HTMLElement
    expect(within(card).getByText(/ta propre semaine passée/)).toBeInTheDocument()
  })
})
