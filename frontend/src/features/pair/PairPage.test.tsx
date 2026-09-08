import { screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '@/store/authStore'
import { pairActiveFixture, pairPendingFixture } from '@/test/fixtures'
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

describe('PairPage leaving', () => {
  beforeEach(() => {
    useAuthStore.setState({ userId: 'u1' })
  })

  function mountPaired() {
    server.use(
      http.get(path('/pair'), () => ok(pairActiveFixture)),
      http.post(path('/auth/refresh'), () => ok({ accessToken: 't', userId: 'u1' })),
    )
    return renderWithProviders(<PairPage />)
  }

  /** Recorded so a test can assert the request was withheld, not merely that a dialog showed. */
  function leaveHandler(respond: () => Response = () => ok(pairPendingFixture)) {
    const calls: number[] = []
    const handler = http.delete(path('/pair/membership'), () => {
      calls.push(1)
      return respond()
    })
    return { handler, calls }
  }

  it('asks before ending anything', async () => {
    const { handler, calls } = leaveHandler()
    server.use(handler)
    const { user } = mountPaired()

    await user.click(await screen.findByRole('button', { name: i18n.t('pair.leave') }))

    expect(
      screen.getByText(i18n.t('pair.leaveConfirmTitle', { name: 'Bruno' })),
    ).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })

  it('sends nothing when the person backs out', async () => {
    const { handler, calls } = leaveHandler()
    server.use(handler)
    const { user } = mountPaired()

    await user.click(await screen.findByRole('button', { name: i18n.t('pair.leave') }))
    await user.click(screen.getByRole('button', { name: i18n.t('pair.leaveCancel') }))

    expect(calls).toHaveLength(0)
    expect(screen.queryByText(i18n.t('pair.leaveConfirmText'))).not.toBeInTheDocument()
  })

  it('ends the pair and shows the invite screen again', async () => {
    const { handler, calls } = leaveHandler()
    server.use(handler)
    const { user } = mountPaired()

    await user.click(await screen.findByRole('button', { name: i18n.t('pair.leave') }))
    await user.click(screen.getByRole('button', { name: i18n.t('pair.leaveConfirm') }))

    await waitFor(() => expect(calls).toHaveLength(1))
    // Back to the screen for someone with no partner: the code to share is on it.
    expect(await screen.findByText(i18n.t('pair.sendCode'))).toBeInTheDocument()
  })

  it('keeps the pair on screen when the server refuses', async () => {
    const { handler } = leaveHandler(() => fail(500, 'Erro interno'))
    server.use(handler)
    const { user } = mountPaired()

    await user.click(await screen.findByRole('button', { name: i18n.t('pair.leave') }))
    await user.click(screen.getByRole('button', { name: i18n.t('pair.leaveConfirm') }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro interno')
    expect(screen.getByText(i18n.t('pair.leaveConfirmText'))).toBeInTheDocument()
  })
})
