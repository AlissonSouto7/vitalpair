import { describe, expect, it } from 'vitest'

import { AuthShell } from './AuthShell'

import { renderWithProviders } from '@/test/render'

/** Os três quadrados de confirmação da coluna da esquerda. */
function ticks(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll('li > span')] as HTMLElement[]
}

describe('AuthShell', () => {
  it('marks each promise with a check that reads on its own square', () => {
    /*
      O check era branco sobre os três preenchimentos. No tema escuro eles são claros de
      propósito, então media 1,61:1 sobre o verde e 2,32:1 sobre o laranja: o quadrado
      aparecia vazio, como um borrão colorido. `on-fill` é a mesma solução que o Button já
      usa, e dá 11,52:1 e 7,98:1.
    */
    const { container } = renderWithProviders(
      <AuthShell>
        <span />
      </AuthShell>,
    )

    const marks = ticks(container)
    expect(marks).toHaveLength(3)
    for (const mark of marks) {
      const svg = mark.querySelector('svg')!
      expect(svg.getAttribute('class')).toContain('stroke-on-fill')
      expect(svg.getAttribute('class')).not.toContain('fill-white')
    }
  })

  it('paints the three squares in three different meanings, never twice the same', () => {
    // Laranja é a ação, verde é o feito, bordô é o par: três frases, três papéis. Repetir
    // uma cor faria duas promessas parecerem a mesma coisa.
    const { container } = renderWithProviders(
      <AuthShell>
        <span />
      </AuthShell>,
    )

    const fills = ticks(container).map(
      (el) => el.className.split(/\s+/).find((c) => c.startsWith('bg-')) ?? '',
    )
    expect(fills).toEqual(['bg-act', 'bg-success', 'bg-pair'])
    expect(new Set(fills).size).toBe(3)
  })
})
