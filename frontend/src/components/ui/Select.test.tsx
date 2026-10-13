import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { Select } from './Select'

import { renderWithProviders } from '@/test/render'

/**
 * The dropdown, driven by a keyboard.
 *
 * It is built from buttons rather than a native select so it can be styled, and that choice
 * has to be paid back: a native select navigates with the arrows, announces what is
 * highlighted and closes on Enter for free. These tests are the payment.
 *
 * The sex field in onboarding is one of these, on the second screen anybody sees, so somebody
 * who cannot use a pointer meets it before they have seen anything else in the product.
 */
const OPCOES = [
  { value: 'MALE' as const, label: 'Masculino' },
  { value: 'FEMALE' as const, label: 'Feminino' },
  { value: 'OTHER' as const, label: 'Outro' },
]

function Harness({ inicial = '' as '' | 'MALE' | 'FEMALE' | 'OTHER' }) {
  const [valor, setValor] = useState<'' | 'MALE' | 'FEMALE' | 'OTHER'>(inicial)
  return <Select value={valor} onChange={setValor} options={OPCOES} />
}

/** O texto da opção que o combobox declara como destacada. */
function destacada() {
  const id = screen.getByRole('combobox').getAttribute('aria-activedescendant')
  return id ? (document.getElementById(id)?.textContent?.trim() ?? null) : null
}

describe('Select', () => {
  it('opens with the arrow key and highlights the first option', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    await user.tab()
    expect(screen.getByRole('combobox')).toHaveFocus()
    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(destacada()).toBe('Masculino')
  })

  it('moves through the options with the arrows and wraps around', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    await user.tab()
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(destacada()).toBe('Feminino')

    await user.keyboard('{ArrowDown}{ArrowDown}')
    // Da última volta para a primeira, que é o que poupa segurar a seta para cima.
    expect(destacada()).toBe('Masculino')

    await user.keyboard('{ArrowUp}')
    expect(destacada()).toBe('Outro')
  })

  it('jumps to the ends with Home and End', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    await user.tab()
    await user.keyboard('{ArrowDown}{End}')
    expect(destacada()).toBe('Outro')

    await user.keyboard('{Home}')
    expect(destacada()).toBe('Masculino')
  })

  it('chooses the highlighted option with Enter and closes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    await user.tab()
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')

    expect(screen.getByRole('combobox')).toHaveTextContent('Feminino')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('does not choose anything when Enter is pressed on a list nobody has moved through', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    // Aberto com Enter, sem seta: nada está destacado, então Enter não pode escolher a
    // primeira opção por conta própria.
    await user.tab()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.keyboard('{Enter}')

    expect(screen.getByRole('combobox')).toHaveTextContent('Selecione')
  })

  it('ties the button to the list it opens, so a screen reader can follow', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    const combo = screen.getByRole('combobox')
    expect(combo).toHaveAttribute('aria-expanded', 'false')
    expect(combo).not.toHaveAttribute('aria-controls')

    await user.click(combo)

    /*
     * Sem `aria-controls` o botão e a lista são dois elementos sem relação declarada, e sem
     * `aria-activedescendant` o leitor de tela continua anunciando o botão enquanto as setas
     * andam pela lista. Os dois faltavam.
     */
    expect(combo).toHaveAttribute('aria-expanded', 'true')
    expect(combo.getAttribute('aria-controls')).toBe(screen.getByRole('listbox').id)
  })

  it('closes with Escape without choosing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    await user.tab()
    await user.keyboard('{ArrowDown}{ArrowDown}{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveTextContent('Selecione')
  })

  it('opens on what is already chosen, not on the top of the list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness inicial="OTHER" />)

    await user.tab()
    await user.keyboard('{ArrowDown}')

    // Quem já escolheu "Outro" e reabre a lista está perto de mudar para o vizinho, não de
    // recomeçar do primeiro item.
    expect(destacada()).toBe('Outro')
  })
})
