import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ConfirmDialog } from './ConfirmDialog'

import { renderWithProviders } from '@/test/render'

function open(over: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  renderWithProviders(
    <ConfirmDialog
      title='Apagar "Arroz"?'
      description="Some do seu dia e do feed da dupla."
      confirmLabel="Apagar"
      cancelLabel="Deixa pra lá"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...over}
    />,
  )
  return { onConfirm, onCancel }
}

describe('ConfirmDialog', () => {
  it('says what the action takes with it, not just "are you sure"', () => {
    // Apagar uma refeição leva junto a linha do feed da dupla e os pontos que ela rendeu.
    // "Tem certeza?" não informa nada; o que faz alguém decidir é saber o que vai junto.
    open()

    const box = screen.getByRole('dialog')
    expect(box).toHaveAccessibleName('Apagar "Arroz"?')
    expect(box).toHaveAccessibleDescription('Some do seu dia e do feed da dupla.')
  })

  it('does nothing until the person confirms', async () => {
    const user = userEvent.setup()
    const { onConfirm, onCancel } = open()

    await user.click(screen.getByRole('button', { name: 'Deixa pra lá' }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('confirms only on the confirm button', async () => {
    const user = userEvent.setup()
    const { onConfirm } = open()

    await user.click(screen.getByRole('button', { name: 'Apagar' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('lands the focus on the way out, not on the destructive button', () => {
    /*
      Quem chegou até aqui apertando Enter confirmaria sem ler se o foco caísse no botão de
      apagar. O foco vai para o cancelar, que é a saída segura.
    */
    open()

    expect(screen.getByRole('button', { name: 'Deixa pra lá' })).toHaveFocus()
  })

  it('closes on Escape, which is how a dialog is meant to be left', async () => {
    const user = userEvent.setup()
    const { onCancel, onConfirm } = open()

    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('does not close when the click starts inside the box', async () => {
    // Arrastar o cursor para fora ao selecionar o texto fecharia o diálogo no meio da
    // leitura se o clique de dentro contasse como clique no fundo.
    const user = userEvent.setup()
    const { onCancel } = open()

    await user.click(screen.getByRole('dialog'))
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('blocks the confirm while the request is still going', async () => {
    // Sem isso, dois cliques rápidos mandam duas remoções, e a segunda falha com "não
    // encontrado" numa tela que já tinha dado certo.
    const user = userEvent.setup()
    const { onConfirm } = open({ busy: true })

    await user.click(screen.getByRole('button', { name: 'Apagar' }))
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
