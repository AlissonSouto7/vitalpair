import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { LoginPage } from './LoginPage'

import i18n from '@/i18n'
import { renderWithProviders } from '@/test/render'

describe('LoginPage', () => {
  it('clears the e-mail error as soon as the field holds a valid address', async () => {
    /*
      O erro ficava na tela por cima de um e-mail correto.

      Ao escolher um endereço na lista de sugestões, o Chrome escreve o valor no campo sem
      disparar `input`, então o formulário continua com o valor antigo e com o erro que ele
      gerou. O que o navegador dispara é a animação do `:-webkit-autofill`, e o TextField
      escuta essa animação para reenviar o valor ao formulário.
    */
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    const email = screen.getByLabelText(i18n.t('auth.email'))
    await user.type(email, 'nao-e-email')
    await user.tab()

    expect(await screen.findByText(i18n.t('auth.invalidEmail'))).toBeInTheDocument()

    /*
      O caso real, medido no Chrome em 16/09/2026: ao escolher um endereço na lista de
      sugestões ele escreve o valor e **não** dispara `input`. O formulário fica com o valor
      antigo, e a mensagem continua embaixo de um e-mail correto.

      Disparar `input` aqui não reproduziria nada: com o evento o erro já sumia sozinho
      antes da correção. O que o navegador dispara é a animação do `:-webkit-autofill`, e é
      só ela que o TextField tem para se guiar.
    */
    // O setter nativo, e não `email.value = ...`: o React sobrescreve a propriedade no
    // elemento para detectar mudanças, e escrever nela direto não altera o valor real. A
    // regra alerta sobre `this` perdido ao separar um método do objeto; aqui ele é passado
    // de propósito pelo `.call` logo abaixo.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => {
      setter.call(email, 'alisson@vitalpair.app')
      // O jsdom não implementa AnimationEvent, então o evento é montado à mão com a única
      // propriedade que o componente lê.
      const autofilled = new Event('animationstart', { bubbles: true })
      Object.defineProperty(autofilled, 'animationName', { value: 'vp-autofilled' })
      email.dispatchEvent(autofilled)
    })

    await waitFor(() => {
      expect(screen.queryByText(i18n.t('auth.invalidEmail'))).not.toBeInTheDocument()
    })
  })

  it('still refuses to submit an address that is not one', async () => {
    // A outra metade: a revalidação não pode ter afrouxado a regra.
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText(i18n.t('auth.email')), 'nao-e-email')
    await user.type(screen.getByLabelText(i18n.t('auth.password')), 'algumaSenha1')
    await user.click(screen.getByRole('button', { name: i18n.t('auth.signIn') }))

    expect(await screen.findByText(i18n.t('auth.invalidEmail'))).toBeInTheDocument()
  })
})
