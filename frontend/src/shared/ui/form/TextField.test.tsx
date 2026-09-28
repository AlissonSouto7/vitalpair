import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { TextField } from './TextField'

import { renderWithProviders } from '@/test/render'

/**
 * A labelled input, and the order somebody meets it in.
 *
 * The label is tied to the field, so a screen reader announces what the box is for, clicking
 * the text focuses it, and a test can find it by name. The `action` slot, which is where the
 * "forgot password" link lives, is drawn beside the label but must not come before the field
 * in the document: reading order and tab order follow the document, not the drawing.
 */
describe('TextField', () => {
  it('ties the label to the field, so clicking the text focuses it', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TextField label="E-mail" />)

    await user.click(screen.getByText('E-mail'))

    expect(screen.getByLabelText('E-mail')).toHaveFocus()
  })

  it('reads the error with the field instead of leaving it loose on the page', () => {
    renderWithProviders(<TextField label="Senha" error="Senha muito curta" />)

    const campo = screen.getByLabelText('Senha')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAccessibleDescription('Senha muito curta')
  })

  it('puts the action after the field, so tabbing does not leave the form between two inputs', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <form>
        <TextField label="E-mail" type="email" />
        <TextField label="Senha" type="password" action={<a href="/forgot-password">Esqueci</a>} />
      </form>,
    )

    /*
     * Measured on the sign-in screen before this: the tab order was e-mail -> "Esqueci" ->
     * senha, because the link was written before the input it sits beside. The way out of the
     * page ran between the two fields somebody is filling in, so one extra Tab took them off
     * the form without meaning to. `order` moves the drawing, not the document.
     */
    await user.tab()
    expect(screen.getByLabelText('E-mail')).toHaveFocus()

    await user.tab()
    expect(screen.getByLabelText('Senha')).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('link', { name: 'Esqueci' })).toHaveFocus()
  })
})
