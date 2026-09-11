import { screen } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { WorkoutPlanPage } from './WorkoutPlanPage'

import { freeEntitlementFixture, premiumEntitlementFixture } from '@/test/fixtures'
import { ok, path } from '@/test/msw/api'
import { server } from '@/test/msw/server'
import { i18n, renderWithProviders } from '@/test/render'
import type { Entitlement } from '@/types/entitlement'

function mount(entitlement: Entitlement) {
  server.use(
    http.get(path('/workout-plan/today'), () => ok(null)),
    http.get(path('/entitlements/me'), () => ok(entitlement)),
  )
  return renderWithProviders(<WorkoutPlanPage />)
}

/**
 * What the screen shows to someone who has not paid, and to someone who has.
 *
 * The paid plan gates generating, and the decision is taken from the entitlement the
 * screen reads, not from a refused request: a free account never sees a button that would
 * only answer 402.
 */
describe('WorkoutPlanPage and the paid plan', () => {
  it('shows the paid-plan notice instead of the generate button to a free account', async () => {
    mount(freeEntitlementFixture)

    expect(await screen.findByTestId('premium-callout')).toBeInTheDocument()
    expect(screen.getByText(i18n.t('premium.title'))).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: new RegExp(i18n.t('workoutplan.generate')) }),
    ).not.toBeInTheDocument()
  })

  it('shows the generate button, and no notice, to an account with access', async () => {
    mount(premiumEntitlementFixture)

    expect(
      await screen.findByRole('button', { name: new RegExp(i18n.t('workoutplan.generate')) }),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('premium-callout')).not.toBeInTheDocument()
  })
})
