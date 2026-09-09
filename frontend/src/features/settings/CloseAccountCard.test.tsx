import { screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { CloseAccountCard } from './CloseAccountCard'

import type { TranslationBundle } from '@/locales'
import { useAuthStore } from '@/store/authStore'
import { fail, ok, path } from '@/test/msw/api'
import { server } from '@/test/msw/server'
import { i18n, renderWithProviders } from '@/test/render'

/**
 * The gate in front of the only action in the product that cannot be undone.
 *
 * Every refusal is proved twice: what is on screen, and that the request never left. A
 * disabled-looking button that posts anyway is exactly the failure this guards against.
 */
function closeHandler(respond: () => Response = () => ok(null, 204)) {
  const calls: number[] = []
  const handler = http.delete(path('/users/me'), () => {
    calls.push(1)
    return respond()
  })
  return { handler, calls }
}

/** The keys under a namespace whose value is a string, which is what a test asserts on. */
type LeafKeys<T> = { [K in keyof T]: T[K] extends string ? K : never }[keyof T]

const s = (key: LeafKeys<TranslationBundle['settings']>) => i18n.t(`settings.${key}`)

describe('CloseAccountCard', () => {
  beforeEach(() => {
    useAuthStore.setState({ userId: 'u1', accessToken: 'token' })
  })

  it('does not close on the first press', async () => {
    const { handler, calls } = closeHandler()
    server.use(handler)
    const { user } = renderWithProviders(<CloseAccountCard />)

    await user.click(screen.getByRole('button', { name: s('closeAccount') }))

    expect(screen.getByText(s('closeConfirmTitle'))).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })

  it('says what survives before anything is pressed', async () => {
    server.use(closeHandler().handler)
    const { user } = renderWithProviders(<CloseAccountCard />)

    await user.click(screen.getByRole('button', { name: s('closeAccount') }))

    expect(screen.getByText(s('closeConfirmText'))).toBeInTheDocument()
  })

  it('refuses to close until the word is typed', async () => {
    const { handler, calls } = closeHandler()
    server.use(handler)
    const { user } = renderWithProviders(<CloseAccountCard />)

    await user.click(screen.getByRole('button', { name: s('closeAccount') }))
    const confirm = screen.getByRole('button', { name: s('closeConfirm') })
    expect(confirm).toBeDisabled()

    await user.type(screen.getByLabelText(/./), 'talvez')
    expect(confirm).toBeDisabled()

    await user.click(confirm)
    expect(calls).toHaveLength(0)
  })

  it('closes once the word is typed, and clears the session', async () => {
    const { handler, calls } = closeHandler()
    server.use(handler)
    const { user } = renderWithProviders(<CloseAccountCard />)

    await user.click(screen.getByRole('button', { name: s('closeAccount') }))
    await user.type(screen.getByLabelText(/./), s('closeConfirmWord'))
    await user.click(screen.getByRole('button', { name: s('closeConfirm') }))

    await waitFor(() => expect(calls).toHaveLength(1))
    await waitFor(() => expect(useAuthStore.getState().accessToken).toBeNull())
  })

  it('accepts the word in any case, because the field uppercases visually', async () => {
    const { handler, calls } = closeHandler()
    server.use(handler)
    const { user } = renderWithProviders(<CloseAccountCard />)

    await user.click(screen.getByRole('button', { name: s('closeAccount') }))
    await user.type(screen.getByLabelText(/./), s('closeConfirmWord').toLowerCase())
    await user.click(screen.getByRole('button', { name: s('closeConfirm') }))

    await waitFor(() => expect(calls).toHaveLength(1))
  })

  it('sends nothing when the person backs out', async () => {
    const { handler, calls } = closeHandler()
    server.use(handler)
    const { user } = renderWithProviders(<CloseAccountCard />)

    await user.click(screen.getByRole('button', { name: s('closeAccount') }))
    await user.type(screen.getByLabelText(/./), s('closeConfirmWord'))
    await user.click(screen.getByRole('button', { name: s('closeCancel') }))

    expect(calls).toHaveLength(0)
    expect(screen.queryByText(s('closeConfirmTitle'))).not.toBeInTheDocument()
  })

  it('keeps the session when the server refuses', async () => {
    server.use(closeHandler(() => fail(500, 'Erro interno')).handler)
    const { user } = renderWithProviders(<CloseAccountCard />)

    await user.click(screen.getByRole('button', { name: s('closeAccount') }))
    await user.type(screen.getByLabelText(/./), s('closeConfirmWord'))
    await user.click(screen.getByRole('button', { name: s('closeConfirm') }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro interno')
    expect(useAuthStore.getState().accessToken).toBe('token')
  })
})
