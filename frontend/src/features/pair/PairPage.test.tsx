import { screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '@/store/authStore'
import { pairPendingFixture } from '@/test/fixtures'
import { fail, ok, path } from '@/test/msw/api'
import { server } from '@/test/msw/server'
import { i18n, renderWithProviders } from '@/test/render'

import { PairPage } from './PairPage'

/** Records which code reached the server; the code travels in the URL, not the body. */
function joinHandler(respond: () => Response = () => ok(pairPendingFixture)) {
  const codes: string[] = []
  const handler = http.post(path('/pair/join/:code'), ({ params }) => {
    codes.push(String(params.code))
    return respond()
  })
  return { handler, codes }
}

function mount() {
  server.use(
    http.get(path('/pair'), () => ok(pairPendingFixture)),
    http.post(path('/auth/refresh'), () => ok({ accessToken: 't', userId: 'u1' })),
  )
  return renderWithProviders(<PairPage />)
}

async function codeInput() {
  return screen.findByLabelText(i18n.t('pair.haveCodeTitle'))
}

function joinButton() {
  return screen.getByRole('button', { name: i18n.t('pair.joinPair') })
}

describe('PairPage join form', () => {
  beforeEach(() => {
    useAuthStore.setState({ userId: 'u1' })
  })

  it('refuses a blank code without asking the server', async () => {
    const { handler, codes } = joinHandler()
    server.use(handler)
    const { user } = mount()

    await user.type(await codeInput(), '   ')
    await user.click(joinButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('pair.codeInvalid'))
    expect(codes).toHaveLength(0)
  })

  it('refuses a code with the wrong shape', async () => {
    const { handler, codes } = joinHandler()
    server.use(handler)
    const { user } = mount()

    await user.type(await codeInput(), 'VITA-0000')
    await user.click(joinButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('pair.codeInvalid'))
    expect(codes).toHaveLength(0)
  })

  it('trims and uppercases the code before sending it', async () => {
    const { handler, codes } = joinHandler()
    server.use(handler)
    const { user } = mount()

    await user.type(await codeInput(), ' abcd2345 ')
    await user.click(joinButton())

    await waitFor(() => expect(codes).toEqual(['ABCD2345']))
  })

  it('shows its own message instead of the generic validation one', async () => {
    // "Erro de validação" says nothing a person can act on. errors.ts filters it, but this
    // page used to read the response by hand and showed it anyway.
    const { handler } = joinHandler(() => fail(400, 'Erro de validação'))
    server.use(handler)
    const { user } = mount()

    await user.type(await codeInput(), 'ABCD2345')
    await user.click(joinButton())

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(i18n.t('pair.joinError'))
    expect(alert).not.toHaveTextContent('Erro de validação')
  })

  it('shows a specific message the server sent', async () => {
    const { handler } = joinHandler(() => fail(404, 'Código não encontrado'))
    server.use(handler)
    const { user } = mount()

    await user.type(await codeInput(), 'ABCD2345')
    await user.click(joinButton())

    expect(await screen.findByRole('alert')).toHaveTextContent('Código não encontrado')
  })
})
