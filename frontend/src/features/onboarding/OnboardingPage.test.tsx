import { screen, waitFor, within } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { OnboardingPage } from './OnboardingPage'

import { profileFixture, tdeeFixture } from '@/test/fixtures'
import { ok, path, recording } from '@/test/msw/api'
import { server } from '@/test/msw/server'
import { i18n, renderWithProviders } from '@/test/render'
import type { UpdateProfilePayload } from '@/types/profile'

type User = ReturnType<typeof renderWithProviders>['user']

function mount() {
  const { handler, calls } = recording<UpdateProfilePayload>('put', '/users/me', () =>
    ok(profileFixture),
  )
  server.use(
    handler,
    http.get(path('/users/me/tdee'), () => ok(tdeeFixture)),
  )
  return { calls, ...renderWithProviders(<OnboardingPage />) }
}

/** Several fields can be wrong at once, so the message is looked for among all alerts. */
async function expectAlert(text: string) {
  await waitFor(() => {
    const alerts = screen.getAllByRole('alert').map((a) => a.textContent)
    expect(alerts).toContain(text)
  })
}

/**
 * Picks a row from one of the styled dropdowns, the way a person does: open it, click the
 * row. The row is a button inside the option, which is why the click targets the button.
 */
async function choose(user: User, trigger: HTMLElement, option: string) {
  await user.click(trigger)
  await user.click(within(screen.getByRole('option', { name: option })).getByRole('button'))
}

const continueButton = () => screen.getByRole('button', { name: i18n.t('onboarding.continue') })

/** Fills step 1 with ordinary values: nothing here is an edge case. */
async function fillAboutYou(user: User) {
  await user.type(screen.getByLabelText(i18n.t('onboarding.nameLabel')), 'Novato')
  await user.type(screen.getByLabelText(i18n.t('onboarding.weightLabel')), '78')
  await user.type(screen.getByLabelText(i18n.t('onboarding.heightLabel')), '179')

  // The group carries the name; its three dropdowns have none of their own, since a
  // combobox is named by its author rather than by its contents. Taken in order.
  const birth = within(screen.getByRole('group', { name: i18n.t('onboarding.birthLabel') }))
  const [day, month, year] = birth.getAllByRole('combobox')
  await choose(user, day, '15')
  await choose(user, month, 'Maio')
  await choose(user, year, '1995')

  await choose(
    user,
    screen.getByRole('combobox', { name: i18n.t('onboarding.sexLabel') }),
    i18n.t('onboarding.sexMale'),
  )
  await user.click(
    screen.getByRole('button', { name: new RegExp(i18n.t('onboarding.goalLoseLabel')) }),
  )
}

describe('OnboardingPage step 1', () => {
  it('refuses to advance with the form empty, and says which fields are missing', async () => {
    const { user, calls } = mount()

    await user.click(continueButton())

    // The banner the page always showed, and now a message next to each field as well:
    // "fill in everything" never said what was missing.
    expect(await screen.findByText(i18n.t('onboarding.errorStep1'))).toBeInTheDocument()
    await expectAlert(i18n.t('onboarding.nameRequired'))
    await expectAlert(i18n.t('onboarding.weightInvalid'))
    await expectAlert(i18n.t('onboarding.heightInvalid'))
    await expectAlert(i18n.t('onboarding.birthDateInvalid'))
    await expectAlert(i18n.t('onboarding.sexRequired'))
    await expectAlert(i18n.t('onboarding.goalRequired'))

    // Still on the first step.
    expect(screen.getByLabelText(i18n.t('onboarding.nameLabel'))).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })

  it('refuses a height outside 50 to 300 cm', async () => {
    const { user, calls } = mount()
    await fillAboutYou(user)

    const height = screen.getByLabelText(i18n.t('onboarding.heightLabel'))
    await user.clear(height)
    await user.type(height, '10')
    await user.click(continueButton())

    await expectAlert(i18n.t('onboarding.heightInvalid'))
    expect(screen.getByLabelText(i18n.t('onboarding.nameLabel'))).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })

  it('keeps what was typed when the person comes back from step 2', async () => {
    // The form belongs to the page, not to the step. A form inside the step would be
    // unmounted on the way to step 2 and come back empty.
    const { user } = mount()
    await fillAboutYou(user)
    await user.click(continueButton())
    await user.click(await screen.findByRole('button', { name: i18n.t('onboarding.back') }))

    expect(screen.getByLabelText(i18n.t('onboarding.nameLabel'))).toHaveValue('Novato')
    expect(screen.getByLabelText(i18n.t('onboarding.weightLabel'))).toHaveValue(78)
    expect(screen.getByLabelText(i18n.t('onboarding.heightLabel'))).toHaveValue(179)
    expect(screen.getByRole('combobox', { name: i18n.t('onboarding.sexLabel') })).toHaveTextContent(
      i18n.t('onboarding.sexMale'),
    )
    expect(
      screen.getByRole('button', { name: new RegExp(i18n.t('onboarding.goalLoseLabel')) }),
    ).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('OnboardingPage step 2', () => {
  it('refuses to leave the routine step without a level, and sends nothing', async () => {
    const { user, calls } = mount()
    await fillAboutYou(user)
    await user.click(continueButton())

    await user.click(await screen.findByRole('button', { name: i18n.t('onboarding.step2Next') }))

    expect(await screen.findByText(i18n.t('onboarding.errorStep2'))).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })

  it('sends the profile with numbers as numbers, then shows the target', async () => {
    const { user, calls } = mount()
    await fillAboutYou(user)
    await user.click(continueButton())

    await user.click(
      await screen.findByRole('button', {
        name: new RegExp(i18n.t('onboarding.actModerateLabel')),
      }),
    )
    await user.click(screen.getByRole('button', { name: i18n.t('onboarding.step2Next') }))

    expect(await screen.findByText(i18n.t('onboarding.step3Title'))).toBeInTheDocument()
    expect(calls).toEqual([
      {
        name: 'Novato',
        birthDate: '1995-05-15',
        sex: 'MALE',
        heightCm: 179,
        weightKg: 78,
        goal: 'LOSE_WEIGHT',
        activityLevel: 'MODERATE',
      },
    ])
  })
})
