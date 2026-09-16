import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Scoreboard } from './Scoreboard'

import i18n from '@/i18n'
import { renderWithProviders } from '@/test/render'

/** As duas barras do card: a fina no topo e a grossa no meio. */
function bars(container: HTMLElement) {
  return {
    top: container.querySelector('[class*="absolute"][class*="h-[3px]"]') as HTMLElement,
    main: container.querySelector('[class*="h-[9px]"]') as HTMLElement,
  }
}

describe('Scoreboard', () => {
  it('draws no side at all while nobody has scored', () => {
    // Com 0 a 0 a barra caía em 50/50, e uma barra dividida ao meio não lê como empate:
    // lê como "50% concluído", que é o que uma barra preenchida significa em toda outra
    // tela. E acontecia no dia 1 de toda temporada, quando os dois estão em zero.
    const { container } = renderWithProviders(
      <Scoreboard you={{ name: 'Você', score: 0 }} rival={{ name: 'Bel', score: 0 }} />,
    )

    const { top, main } = bars(container)
    expect(main.children).toHaveLength(0)
    expect(top.style.background).not.toContain('gradient')

    // O texto é quem conta o estado, já que a barra deixou de contar.
    expect(screen.getByText(i18n.t('dashboard.tied'))).toBeInTheDocument()
  })

  it('splits by the score once there are points on the board', () => {
    const { container } = renderWithProviders(
      <Scoreboard you={{ name: 'Você', score: 30 }} rival={{ name: 'Bel', score: 10 }} />,
    )

    const { top, main } = bars(container)
    expect(main.children).toHaveLength(2)
    expect((main.children[0] as HTMLElement).style.width).toBe('75%')
    expect(top.style.background).toContain('75%')
  })

  it('still draws the split when one side has everything', () => {
    // O caso que um `sum > 0` mal escrito quebraria: 12 a 0 tem placar, e a barra deve
    // ficar inteira de um lado, não sumir junto com o 0 a 0.
    const { container } = renderWithProviders(
      <Scoreboard you={{ name: 'Você', score: 12 }} rival={{ name: 'Bel', score: 0 }} />,
    )

    const { main } = bars(container)
    expect(main.children).toHaveLength(2)
    expect((main.children[0] as HTMLElement).style.width).toBe('100%')
  })

  it('describes the bar for someone who cannot see it', () => {
    // A divisão é desenhada com largura e cor, então sem rótulo um leitor de tela não
    // recebe nada do que é a informação principal do card.
    const empty = renderWithProviders(
      <Scoreboard you={{ name: 'Você', score: 0 }} rival={{ name: 'Bel', score: 0 }} />,
    )
    expect(
      empty.container.querySelector(`[aria-label="${i18n.t('dashboard.barEmpty')}"]`),
    ).not.toBeNull()

    const playing = renderWithProviders(
      <Scoreboard you={{ name: 'Você', score: 30 }} rival={{ name: 'Bel', score: 10 }} />,
    )
    expect(
      playing.container.querySelector(
        `[aria-label="${i18n.t('dashboard.barSplit', { you: 75, pair: 25 })}"]`,
      ),
    ).not.toBeNull()
  })

  it('keeps the bar alive, with the two sides taking turns', () => {
    /*
      Um brilho atravessa cada lado a cada 3,6s, e o do par sai com meio ciclo de atraso: os
      dois nunca brilham juntos, então a barra lê como dois lados se revezando em vez de um
      enfeite piscando. Sem isso ela é uma listra estática, e a barra é o placar: parada,
      não conta que a outra pessoa também está jogando.

      A animação some por completo com "reduzir movimento" ligado no sistema, o que o CSS
      garante e o jsdom não executa; aqui o que se verifica é que as classes chegam.
    */
    const { container } = renderWithProviders(
      <Scoreboard you={{ name: 'Você', score: 30 }} rival={{ name: 'Bel', score: 10 }} />,
    )

    const [mine, theirs] = [...bars(container).main.children] as HTMLElement[]
    expect(mine.className).toContain('vp-live')
    expect(theirs.className).toContain('vp-live')
    // Só o lado do par carrega o atraso; os dois com ele brilhariam juntos.
    expect(mine.className).not.toContain('vp-delay')
    expect(theirs.className).toContain('vp-delay')
  })

  it('leaves last week as a still bar, because it is not a second person', () => {
    // No modo solo o outro lado é a sua própria semana passada. Fazê-lo brilhar sugeriria
    // alguém do outro lado registrando agora, que é exatamente o que não está acontecendo.
    const { container } = renderWithProviders(
      <Scoreboard
        you={{ name: 'Você', score: 30 }}
        rival={{ name: 'Semana passada', score: 10, tone: 'ghost' }}
      />,
    )

    const [, theirs] = [...bars(container).main.children] as HTMLElement[]
    expect(theirs.className).not.toContain('vp-live')
  })

  it('letters each square with the initial of whoever it stands for', () => {
    // O padrão era 'V' e 'C', letras fixas que não eram a inicial de ninguém: no placar da
    // dupla Alisson & Bel apareciam um "V" e um "C".
    const { container } = renderWithProviders(
      <Scoreboard you={{ name: 'Bel', score: 10 }} rival={{ name: 'Alisson', score: 0 }} />,
    )

    const squares = [...container.querySelectorAll('span[class*="bg-you"], span[class*="bg-pair"]')]
    expect(squares.map((el) => el.textContent)).toEqual(['B', 'A'])
  })

  it('shows the two people by colour, not by the mascot', () => {
    /*
      O placar usava o mascote, laranja de um lado e roxo do outro: a paleta anterior ao
      Arena, em que laranja identificava você. Hoje laranja é a ação e não identifica
      ninguém, e as duas pessoas são azul e bordô. O mascote segue sendo a marca; aqui o que
      se pergunta é quem é quem.
    */
    const { container } = renderWithProviders(
      <Scoreboard you={{ name: 'Bel', score: 10 }} rival={{ name: 'Alisson', score: 0 }} />,
    )

    const squares = [...container.querySelectorAll('span[class*="bg-you"], span[class*="bg-pair"]')]
    expect(squares).toHaveLength(2)
    expect(squares[0].className).toContain('bg-you')
    expect(squares[1].className).toContain('bg-pair')
    // E nenhum laranja de ação identificando pessoa, que era o que o mascote fazia.
    expect(container.querySelector('[class*="bg-act"]')).toBeNull()
  })
})
