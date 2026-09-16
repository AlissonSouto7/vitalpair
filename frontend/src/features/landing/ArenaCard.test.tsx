import { act, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Hero } from './sections'

import i18n from '@/i18n'
import { renderWithProviders } from '@/test/render'

/** O intervalo do roteiro, em milissegundos. */
const STEP = 2800

/** Os dois números grandes do placar, na ordem em que aparecem. */
function scores(container: HTMLElement): number[] {
  return [...container.querySelectorAll('[class*="text-[40px]"]')].map((el) =>
    Number(el.textContent?.trim()),
  )
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(async () => {
  vi.useRealTimers()
  await i18n.changeLanguage('pt')
})

describe('the landing scoreboard', () => {
  it('plays: the score climbs for whoever logged', () => {
    // A landing dizia que o produto é uma disputa e mostrava três círculos genéricos, então
    // quem chegava tinha de acreditar na descrição. O cartão mostra o placar se movendo.
    const { container } = renderWithProviders(<Hero />)

    // Começa empatado, com o primeiro lance do roteiro já somado ao par (+15).
    expect(scores(container)).toEqual([25, 40])
    expect(screen.getByText('Seu par registrou uma corrida')).toBeInTheDocument()

    act(() => void vi.advanceTimersByTime(STEP))
    expect(scores(container)).toEqual([35, 40])
    expect(screen.getByText('Você registrou o almoço')).toBeInTheDocument()

    act(() => void vi.advanceTimersByTime(STEP))
    expect(scores(container)).toEqual([50, 40])
  })

  it('keeps the contest even across a full lap of the script', () => {
    // O roteiro dá a volta, porque a promessa é a disputa continuar, não alguém ganhar. Se
    // uma volta desequilibrasse, quem ficasse um minuto na página veria um atropelo.
    const { container } = renderWithProviders(<Hero />)

    // Cinco avanços, e não seis: o primeiro lance já está na tela no render, então a volta
    // se fecha no sexto lance, que é o quinto intervalo.
    act(() => void vi.advanceTimersByTime(STEP * 5))

    const [you, pair] = scores(container)
    expect(you).toBe(pair)
    expect(you).toBe(65)

    // E a volta seguinte recomeça pelo mesmo lance, somando por cima do que já havia.
    act(() => void vi.advanceTimersByTime(STEP))
    expect(scores(container)).toEqual([65, 80])
  })

  it('splits the bar by the score and marks where the two meet', () => {
    const { container } = renderWithProviders(<Hero />)

    // 25 a 40 no primeiro lance: 38% para você.
    const fill = container.querySelector('[class*="bg-you"][style*="width"]') as HTMLElement
    const seam = container.querySelector('[aria-hidden="true"][class*="w-[3px]"]') as HTMLElement
    expect(fill.style.width).toBe('38%')
    expect(seam.style.left).toBe('38%')
  })

  it('names nobody real, and says so in every language', async () => {
    // O par não tem nome próprio de propósito: um nome inventado sugeriria uma pessoa real
    // para quem chega na página.
    const { container } = renderWithProviders(<Hero />)
    expect(screen.getAllByText('Seu par').length).toBeGreaterThan(0)

    await act(async () => {
      await i18n.changeLanguage('en')
    })
    expect(screen.getAllByText('Your partner').length).toBeGreaterThan(0)
    expect(screen.getByText('Your partner logged a run')).toBeInTheDocument()
    // A troca de idioma recria o roteiro; o placar tem de continuar coerente e não misturar
    // números de um roteiro com o texto de outro.
    expect(scores(container)).toEqual([25, 40])
  })

  it('holds still for someone who asked for less motion', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('prefers-reduced-motion'),
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))

    const { container } = renderWithProviders(<Hero />)
    expect(scores(container)).toEqual([25, 40])

    act(() => void vi.advanceTimersByTime(STEP * 3))

    // Continua no primeiro lance: nenhum intervalo foi agendado.
    expect(scores(container)).toEqual([25, 40])
    vi.unstubAllGlobals()
  })
})
