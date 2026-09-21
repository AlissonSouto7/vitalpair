import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { MascotPicker } from './MascotPicker'

import { server } from '@/test/msw/server'
import { i18n, renderWithProviders } from '@/test/render'

const p = (k: string) => i18n.t(`profile.${k}` as never)

/**
 * Escolher a aparência do bicho.
 *
 * O rosto vinha do papel no par, decidido dentro do componente de desenho: quem era "você"
 * recebia sobrancelhas grossas e o par recebia cílios. A primeira usuária do app marcou sexo
 * feminino, viu o mascote masculino e perguntou como se troca; não havia como.
 */
describe('MascotPicker', () => {
  it('mostra as duas opções desenhadas, não só os nomes', () => {
    renderWithProviders(<MascotPicker current={null} level={3} />)

    // É uma escolha de aparência: mostrar só o nome pediria que a pessoa adivinhasse.
    expect(screen.getByRole('button', { name: new RegExp(p('mascotSprout')) })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: new RegExp(p('mascotBlossom')) })).toBeInTheDocument()
    expect(document.querySelectorAll('svg[role="img"]')).toHaveLength(2)
  })

  it('marca o que a pessoa já escolheu', () => {
    renderWithProviders(<MascotPicker current="BLOSSOM" level={3} />)

    expect(screen.getByRole('button', { name: new RegExp(p('mascotBlossom')) })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: new RegExp(p('mascotSprout')) })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('marca o Broto quando ainda não houve escolha', () => {
    renderWithProviders(<MascotPicker current={null} level={3} />)

    // Sem escolha gravada é o que a pessoa vê hoje em todas as telas. Não marcar nenhum
    // faria a tela mentir sobre o estado atual.
    expect(screen.getByRole('button', { name: new RegExp(p('mascotSprout')) })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('manda a escolha para o servidor', async () => {
    let enviado: unknown = null
    server.use(
      http.put('*/users/me/mascot', async ({ request }) => {
        enviado = await request.json()
        return HttpResponse.json({ success: true, message: 'ok', data: null })
      }),
    )

    const { user } = renderWithProviders(<MascotPicker current="SPROUT" level={3} />)
    await user.click(screen.getByRole('button', { name: new RegExp(p('mascotBlossom')) }))

    await waitFor(() => expect(enviado).toEqual({ mascot: 'BLOSSOM' }))
  })

  it('avisa quando não consegue salvar', async () => {
    server.use(
      http.put('*/users/me/mascot', () =>
        HttpResponse.json({ success: false, message: 'falhou', data: null }, { status: 500 }),
      ),
    )

    const { user } = renderWithProviders(<MascotPicker current="SPROUT" level={3} />)
    await user.click(screen.getByRole('button', { name: new RegExp(p('mascotBlossom')) }))

    // Uma troca que não foi gravada e não avisa deixa a pessoa achando que trocou.
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
