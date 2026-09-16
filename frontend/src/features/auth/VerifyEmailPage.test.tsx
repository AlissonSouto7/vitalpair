import { screen } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { VerifyEmailPage } from './VerifyEmailPage'

import i18n from '@/i18n'
import { fail, ok, path } from '@/test/msw/api'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'

/** A tela lê o token da query string, que é como o link do e-mail chega. */
function openWith(token: string) {
  return renderWithProviders(<VerifyEmailPage />, { route: `/verify-email?token=${token}` })
}

describe('VerifyEmailPage', () => {
  it('says it worked when the server confirms', async () => {
    /*
      A tela mostrava o erro com o servidor respondendo 200 e a conta já confirmada no banco.

      `verifyEmail` era `Promise<void>`, e uma queryFn que resolve `undefined` é uma query
      falhada para o TanStack Query v5: a confirmação acontecia e a pessoa lia que o link
      tinha expirado, sem nada para fazer a não ser pedir outro que daria no mesmo.
    */
    server.use(http.post(path('/auth/verify-email'), () => ok(null)))

    openWith('um-token-do-email')

    expect(await screen.findByText(i18n.t('auth.verifySuccess'))).toBeInTheDocument()
    expect(screen.queryByText(i18n.t('auth.verifyError'))).not.toBeInTheDocument()
  })

  it('says it failed when the token really is spent', async () => {
    // A outra metade: um token gasto ou vencido tem de continuar reportando o erro, senão a
    // correção teria trocado um estado errado por outro.
    server.use(http.post(path('/auth/verify-email'), () => fail(400, 'Token inválido')))

    openWith('token-ja-gasto')

    expect(await screen.findByText(i18n.t('auth.verifyError'))).toBeInTheDocument()
  })

  it('does not call the server when the link came without a token', async () => {
    // Sem token não há o que confirmar, e uma chamada vazia gastaria uma tentativa de rate
    // limit para receber um 400 que a tela já sabe dar.
    const calls: string[] = []
    server.use(
      http.post(path('/auth/verify-email'), () => {
        calls.push('chamou')
        return ok(null)
      }),
    )

    openWith('')

    expect(await screen.findByText(i18n.t('auth.verifyError'))).toBeInTheDocument()
    expect(calls).toEqual([])
  })
})
