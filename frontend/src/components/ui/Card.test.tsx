import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Card } from './Card'

describe('Card', () => {
  it('gives every card the same edge', () => {
    // O ponto do componente: a base existe para que nenhuma tela invente o próprio card.
    // Antes disto havia 23 combinações diferentes de raio, preenchimento e sombra.
    const { container } = render(<Card>conteúdo</Card>)

    expect(container.firstElementChild).toHaveClass('rounded-xl', 'border', 'bg-surface')
  })

  it('renders as the element the screen asks for', () => {
    // Uma lista de cards é <ul>/<li>, uma seção é <section>. Forçar <div> em tudo
    // deixaria a estrutura sem sentido para quem navega por leitor de tela.
    render(
      <Card as="section" aria-label="resumo">
        hoje
      </Card>,
    )

    expect(screen.getByRole('region', { name: 'resumo' }).tagName).toBe('SECTION')
  })

  it('stays flat unless asked to rise', () => {
    // A sombra diz "objeto separado". Se todo card a tivesse, ela pararia de dizer algo.
    const { container: flat } = render(<Card>plano</Card>)
    const { container: raised } = render(<Card raised>destacado</Card>)

    expect(flat.firstElementChild?.className).not.toContain('shadow')
    expect(raised.firstElementChild?.className).toContain('shadow')
  })

  it('carries the danger tone on the border, never as a fill', () => {
    // Vermelho cheio leria como erro que já aconteceu. A borda avisa sem acusar.
    const { container } = render(<Card tone="danger">encerrar</Card>)

    expect(container.firstElementChild).toHaveClass('border-danger-soft')
    expect(container.firstElementChild).not.toHaveClass('bg-danger')
  })
})
