import { screen } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { MealPlanPage } from './MealPlanPage'

import { freeEntitlementFixture, premiumEntitlementFixture } from '@/test/fixtures'
import { ok, path } from '@/test/msw/api'
import { server } from '@/test/msw/server'
import { i18n, renderWithProviders } from '@/test/render'
import type { Entitlement } from '@/types/entitlement'

function mount(entitlement: Entitlement) {
  server.use(
    http.get(path('/meal-plan'), () => ok(null)),
    http.get(path('/entitlements/me'), () => ok(entitlement)),
  )
  return renderWithProviders(<MealPlanPage />)
}

/**
 * The paid plan at the meal plan screen: the notice for a free account, the button for an
 * account with access. The decision comes from the entitlement, so the free account never
 * sends a request that would be refused.
 */
describe('MealPlanPage and the paid plan', () => {
  it('shows the paid-plan notice instead of the generate button to a free account', async () => {
    mount(freeEntitlementFixture)

    expect(await screen.findByTestId('premium-callout')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: new RegExp(i18n.t('mealplan.generate')) }),
    ).not.toBeInTheDocument()
  })

  it('shows the generate button, and no notice, to an account with access', async () => {
    mount(premiumEntitlementFixture)

    expect(
      await screen.findByRole('button', { name: new RegExp(i18n.t('mealplan.generate')) }),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('premium-callout')).not.toBeInTheDocument()
  })
})
