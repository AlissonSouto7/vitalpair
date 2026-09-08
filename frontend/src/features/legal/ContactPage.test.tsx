import { screen, waitFor } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { loadLegalNamespace } from '@/locales'
import { i18n, renderWithProviders } from '@/test/render'

import { ContactPage } from './ContactPage'
import { openMailClient } from './mailto'

vi.mock('./mailto', () => ({ openMailClient: vi.fn() }))

const contact = (key: string) => i18n.t(`legal.contact.${key}`)

async function expectAlert(text: string) {
  await waitFor(() => {
    const alerts = screen.getAllByRole('alert').map((a) => a.textContent)
    expect(alerts).toContain(text)
  })
}

describe('ContactPage form', () => {
  // The legal texts are a separate chunk, loaded when the page opens. The test needs them
  // too, to read the expected messages through i18n.
  beforeAll(() => loadLegalNamespace('pt'))

  async function submitButton() {
    return screen.findByRole('button', { name: contact('submit') })
  }

  it('refuses empty fields and opens nothing', async () => {
    const { user } = renderWithProviders(<ContactPage />)

    await user.click(await submitButton())

    await expectAlert(contact('nameRequired'))
    await expectAlert(contact('emailInvalid'))
    await expectAlert(contact('messageRequired'))
    expect(openMailClient).not.toHaveBeenCalled()
    expect(screen.queryByText(contact('sentTitle'))).not.toBeInTheDocument()
  })

  it('refuses an e-mail that is not one', async () => {
    const { user } = renderWithProviders(<ContactPage />)
    await submitButton()

    await user.type(screen.getByLabelText(contact('nameLabel')), 'Ana')
    await user.type(screen.getByLabelText(contact('emailLabel')), 'ana-sem-arroba')
    await user.type(screen.getByLabelText(contact('messageLabel')), 'Oi')
    await user.click(await submitButton())

    await expectAlert(contact('emailInvalid'))
    expect(openMailClient).not.toHaveBeenCalled()
  })

  it('opens the mail client with the message filled in', async () => {
    // Before the fix the form showed "message received" for a message that was read
    // nowhere and sent nowhere.
    const { user } = renderWithProviders(<ContactPage />)
    await submitButton()

    await user.type(screen.getByLabelText(contact('nameLabel')), 'Ana Souza')
    await user.type(screen.getByLabelText(contact('emailLabel')), 'ana@example.com')
    await user.type(screen.getByLabelText(contact('messageLabel')), 'Achei um bug na foto.')
    await user.click(await submitButton())

    await waitFor(() => expect(openMailClient).toHaveBeenCalledTimes(1))
    const url = vi.mocked(openMailClient).mock.calls[0][0]
    expect(url.startsWith('mailto:contato@vitalpair.app?')).toBe(true)
    const query = new URLSearchParams(url.slice(url.indexOf('?') + 1))
    expect(query.get('subject')).toContain('Ana Souza')
    expect(query.get('body')).toContain('Achei um bug na foto.')
    expect(query.get('body')).toContain('ana@example.com')
    expect(await screen.findByText(contact('sentTitle'))).toBeInTheDocument()
  })
})
