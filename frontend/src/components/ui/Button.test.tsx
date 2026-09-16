import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Button } from './Button'

describe('Button', () => {
  it('uses the action colour, never a person colour', () => {
    // A regra que não pode ser quebrada: azul é "você" e bordô é "seu par". Se a ação
    // primária fosse azul, você teria o peso do sistema e seu par não, numa disputa que
    // só funciona se os dois valerem o mesmo.
    const { container } = render(<Button>Registrar</Button>)
    const classes = container.firstElementChild?.className ?? ''

    expect(classes).toContain('bg-act')
    expect(classes).not.toContain('bg-you')
    expect(classes).not.toContain('bg-pair')
  })

  it('keeps red for what destroys something', () => {
    const { container } = render(<Button variant="danger">Apagar</Button>)

    expect(container.firstElementChild?.className).toContain('danger')
  })

  it('defaults to type button, so it never submits a form by accident', () => {
    // Um <button> sem type dentro de <form> envia o formulário. É o defeito que só
    // aparece quando alguém põe o componente numa tela com formulário.
    render(<Button>Trocar</Button>)

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('lets the caller ask for submit', () => {
    render(<Button type="submit">Salvar</Button>)

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
