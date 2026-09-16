import { act, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GoogleLoginButton } from './GoogleLoginButton'

import * as auth from '@/api/auth'
import i18n from '@/i18n'
import { renderWithProviders } from '@/test/render'

/**
 * O script do Google, substituído por um duplo.
 *
 * Guardamos o callback que o componente registra porque é por ele que o erro de login
 * chega: é o único caminho em que a mensagem traduzida aparece.
 */
let callback: ((res: { credential: string }) => void) | null = null
const initialize = vi.fn((config: { callback: (res: { credential: string }) => void }) => {
  callback = config.callback
})
const renderButton = vi.fn()

beforeEach(() => {
  callback = null
  initialize.mockClear()
  renderButton.mockClear()
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'client-123')
  window.google = { accounts: { id: { initialize, renderButton } } }
})

afterEach(async () => {
  delete window.google
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  await i18n.changeLanguage('pt')
})

describe('GoogleLoginButton', () => {
  it('reports the failure in the language on screen at the time', async () => {
    // O `t` é lido dentro do callback do Google, que é registrado uma vez só. Sem o ref, a
    // mensagem ficava congelada no idioma em que a tela montou: quem trocasse para inglês e
    // errasse o login recebia o aviso em português.
    vi.spyOn(auth, 'googleLogin').mockRejectedValue(new Error('nope'))
    const onError = vi.fn()

    renderWithProviders(<GoogleLoginButton onError={onError} />)
    await waitFor(() => expect(callback).not.toBeNull())

    await act(async () => {
      await i18n.changeLanguage('en')
    })
    act(() => {
      callback?.({ credential: 'tok' })
    })

    await waitFor(() => expect(onError).toHaveBeenCalledWith(i18n.t('auth.errorGoogle')))
    expect(onError).toHaveBeenCalledWith('Could not sign in with Google. Try again.')
  })

  it('does not rebuild the Google widget when the language changes', async () => {
    // A outra metade do mesmo motivo: `t` muda de identidade a cada troca de idioma, então
    // colocá-lo nas dependências do efeito reinicializaria o script externo e o botão
    // piscaria no meio da tela de login.
    renderWithProviders(<GoogleLoginButton />)
    await waitFor(() => expect(initialize).toHaveBeenCalledTimes(1))

    await act(async () => {
      await i18n.changeLanguage('en')
    })

    expect(initialize).toHaveBeenCalledTimes(1)
    expect(renderButton).toHaveBeenCalledTimes(1)
  })
})
