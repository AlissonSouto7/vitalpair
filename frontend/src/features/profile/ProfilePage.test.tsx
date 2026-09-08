import { screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { ProfilePage } from './ProfilePage'

import { profileFixture, progressFixture, seasonFixture, tdeeFixture } from '@/test/fixtures'
import { fail, ok, path, recording } from '@/test/msw/api'
import { server } from '@/test/msw/server'
import { i18n, renderWithProviders } from '@/test/render'
import type { UpdateProfilePayload } from '@/types/profile'


function mount(profile = profileFixture) {
  server.use(
    http.get(path('/users/me'), () => ok(profile)),
    http.get(path('/users/me/tdee'), () => ok(tdeeFixture)),
    http.get(path('/progress'), () => ok(progressFixture)),
    http.get(path('/season'), () => ok(seasonFixture)),
  )
  return renderWithProviders(<ProfilePage />)
}

/** Several fields can be wrong at once, so the message is looked for among all alerts. */
async function expectAlert(text: string) {
  await waitFor(() => {
    const alerts = screen.getAllByRole('alert').map((a) => a.textContent)
    expect(alerts).toContain(text)
  })
}

describe('ProfilePage weight card', () => {
  it('shows the failure when the weight cannot be saved', async () => {
    // Before the fix this handler had no catch: the rejection went nowhere and the person
    // was left believing the weight had been saved.
    server.use(http.post(path('/progress/weight'), () => fail(500, 'Erro interno')))
    const { user } = mount()

    await user.type(await screen.findByLabelText(i18n.t('profile.updateWeight')), '80')
    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }))

    await expectAlert('Erro interno')
  })

  it('refuses a weight no person has', async () => {
    const { handler, calls } = recording('post', '/progress/weight')
    server.use(handler)
    const { user } = mount()

    await user.type(await screen.findByLabelText(i18n.t('profile.updateWeight')), '1000')
    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }))

    await expectAlert(i18n.t('progress.weightInvalid'))
    expect(calls).toHaveLength(0)
  })
})

describe('ProfilePage edit form', () => {
  async function openEditor(user: ReturnType<typeof mount>['user']) {
    await user.click(
      await screen.findByRole('button', { name: new RegExp(i18n.t('profile.edit')) }),
    )
    return screen.getByRole('button', { name: i18n.t('profile.saveData') })
  }

  it('refuses an empty name', async () => {
    const { handler, calls } = recording('put', '/users/me')
    server.use(handler)
    const { user } = mount()
    const save = await openEditor(user)

    await user.clear(screen.getByLabelText(i18n.t('profile.name')))
    await user.click(save)

    await expectAlert(i18n.t('profile.nameRequired'))
    expect(calls).toHaveLength(0)
  })

  it('refuses a height outside 50 to 300 cm', async () => {
    const { handler, calls } = recording('put', '/users/me')
    server.use(handler)
    const { user } = mount()
    const save = await openEditor(user)

    const height = screen.getByLabelText(i18n.t('profile.height'))
    await user.clear(height)
    await user.type(height, '10')
    await user.click(save)

    await expectAlert(i18n.t('profile.heightInvalid'))
    expect(calls).toHaveLength(0)
  })

  it('asks for the sex when the profile has none, next to that field', async () => {
    const { handler, calls } = recording('put', '/users/me')
    server.use(handler)
    const { user } = mount({ ...profileFixture, sex: null })
    const save = await openEditor(user)

    await user.click(save)

    await expectAlert(i18n.t('profile.sexRequired'))
    expect(calls).toHaveLength(0)
  })

  it('sends the profile with numbers as numbers when everything is valid', async () => {
    const { handler, calls } = recording<UpdateProfilePayload>('put', '/users/me', () =>
      ok(profileFixture),
    )
    server.use(handler)
    const { user } = mount()
    const save = await openEditor(user)

    const name = screen.getByLabelText(i18n.t('profile.name'))
    await user.clear(name)
    await user.type(name, 'Ana Lima')
    await user.click(save)

    await waitFor(() =>
      expect(calls).toEqual([
        {
          name: 'Ana Lima',
          birthDate: '1995-05-10',
          sex: 'MALE',
          heightCm: 175,
          weightKg: 78,
          goal: 'LOSE_WEIGHT',
          activityLevel: 'MODERATE',
        },
      ]),
    )
  })
})
