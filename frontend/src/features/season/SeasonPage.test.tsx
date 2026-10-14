import { screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { SeasonPage } from './SeasonPage'

import { pairActiveFixture, profileFixture, seasonFixture } from '@/test/fixtures'
import { fail, ok, path, recording } from '@/test/msw/api'
import { server } from '@/test/msw/server'
import { i18n, renderWithProviders } from '@/test/render'

/**
 * A aposta, que a tela mostrava e ninguém conseguia mudar.
 *
 * O endpoint `PUT /api/v1/season/stake` existe desde que a temporada subiu e nenhuma tela o
 * chamava: a aposta aparecia em dois cartões, sempre com o valor que o servidor grava quando
 * ninguém escolheu. Pior, o último passo do onboarding pede a aposta, não a grava (não existe
 * temporada antes de haver par, e isso está certo) e promete no comentário que "quem forma
 * par define a aposta na tela de temporada" — a tela que não tinha como definir.
 */
function mount(season = seasonFixture) {
  server.use(
    http.get(path('/season'), () => ok(season)),
    http.get(path('/pair'), () => ok(pairActiveFixture)),
    http.get(path('/users/me'), () => ok(profileFixture)),
  )
  return renderWithProviders(<SeasonPage />)
}

async function openEditor(user: ReturnType<typeof mount>['user']) {
  await user.click(await screen.findByRole('button', { name: i18n.t('season.stakeEdit') }))
  return screen.getByLabelText(i18n.t('season.stakeLabel'))
}

describe('SeasonPage: changing the stake', () => {
  it('saves what the pair agreed on', async () => {
    const { handler, calls } = recording<{ stake: string }>('put', '/season/stake', () =>
      ok({ ...seasonFixture, stake: 'Quem perder lava a louça' }),
    )
    server.use(handler)
    const { user } = mount()

    const field = await openEditor(user)
    await user.clear(field)
    await user.type(field, 'Quem perder lava a louça')
    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }))

    await waitFor(() => expect(calls).toEqual([{ stake: 'Quem perder lava a louça' }]))
  })

  it('opens empty when nobody has chosen a stake yet', async () => {
    /*
     * O servidor grava "Quem perder paga o jantar" em toda temporada nova, porque é o valor
     * inicial da coluna e não a escolha de alguém. Pré-preencher o campo com ele faria a
     * pessoa salvar o padrão como se fosse decisão dela; pior, em inglês salvaria a tradução
     * do padrão como texto livre em português.
     */
    const { user } = mount({ ...seasonFixture, stake: 'Quem perder paga o jantar' })

    const field = await openEditor(user)

    expect(field).toHaveValue('')
  })

  it('opens with the stake already chosen, so a small edit is a small edit', async () => {
    const { user } = mount({ ...seasonFixture, stake: 'Quem perder lava a louça' })

    const field = await openEditor(user)

    expect(field).toHaveValue('Quem perder lava a louça')
  })

  it('refuses to send an empty stake, as the server would', async () => {
    // @NotBlank no servidor. Mandar e levar 400 faria a tela dizer "não consegui salvar"
    // sobre algo que ela mesma sabia estar errado.
    const { handler, calls } = recording<{ stake: string }>('put', '/season/stake', () =>
      ok(seasonFixture),
    )
    server.use(handler)
    const { user } = mount()

    const field = await openEditor(user)
    await user.clear(field)
    await user.type(field, '   ')
    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }))

    expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('season.stakeRequired'))
    expect(calls).toHaveLength(0)
  })

  it('says so when the save fails instead of pretending it worked', async () => {
    server.use(http.put(path('/season/stake'), () => fail(500, 'Erro interno')))
    const { user } = mount()

    const field = await openEditor(user)
    await user.clear(field)
    await user.type(field, 'Massagem nos pés')
    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('does not offer to change the stake when there is nobody to bet against', async () => {
    // Uma aposta é um acordo entre duas pessoas. Sozinho, o campo seria um bilhete para si.
    mount({ ...seasonFixture, hasPartner: false })

    await screen.findByText(i18n.t('season.statStakeTitle'))
    expect(
      screen.queryByRole('button', { name: i18n.t('season.stakeEdit') }),
    ).not.toBeInTheDocument()
  })
})
