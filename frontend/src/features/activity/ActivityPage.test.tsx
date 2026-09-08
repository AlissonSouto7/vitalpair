import { screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { activityLogsFixture, activitySummaryFixture } from '@/test/fixtures'
import { ok, path, recording } from '@/test/msw/api'
import { server } from '@/test/msw/server'
import { i18n, renderWithProviders } from '@/test/render'
import type { LogActivityPayload } from '@/types/activity'

import { ActivityPage } from './ActivityPage'

function mount() {
  server.use(
    http.get(path('/activity/logs'), () => ok(activityLogsFixture)),
    http.get(path('/activity/summary'), () => ok(activitySummaryFixture)),
  )
  const { handler, calls } = recording<LogActivityPayload>('post', '/activity/logs', (body) =>
    ok({ ...body, id: 'a1', caloriesBurned: 0, loggedAt: '2026-09-08T12:00:00Z' }),
  )
  server.use(handler)
  return { ...renderWithProviders(<ActivityPage />), calls }
}

async function expectAlert(text: string) {
  await waitFor(() => {
    const alerts = screen.getAllByRole('alert').map((a) => a.textContent)
    expect(alerts).toContain(text)
  })
}

describe('ActivityPage steps form', () => {
  async function openSteps(user: ReturnType<typeof mount>['user']) {
    await user.click(await screen.findByRole('button', { name: i18n.t('activity.tabSteps') }))
    return {
      input: screen.getByLabelText(i18n.t('activity.stepsQuestion')),
      submit: screen.getByRole('button', { name: new RegExp(i18n.t('activity.registerSteps')) }),
    }
  }

  it('refuses zero steps and says so', async () => {
    const { user, calls } = mount()
    const { input, submit } = await openSteps(user)

    await user.type(input, '0')
    await user.click(submit)

    await expectAlert(i18n.t('activity.stepsInvalid'))
    expect(calls).toHaveLength(0)
  })

  it('refuses an empty count and says so', async () => {
    const { user, calls } = mount()
    const { submit } = await openSteps(user)

    await user.click(submit)

    await expectAlert(i18n.t('activity.stepsInvalid'))
    expect(calls).toHaveLength(0)
  })

  it('logs a typed count as a number', async () => {
    const { user, calls } = mount()
    const { input, submit } = await openSteps(user)

    await user.type(input, '5000')
    await user.click(submit)

    await waitFor(() =>
      expect(calls).toEqual([{ activityType: 'STEPS', steps: 5000, source: 'MANUAL' }]),
    )
  })

  it('adds the quick buttons to the count', async () => {
    const { user, calls } = mount()
    const { submit } = await openSteps(user)

    await user.click(screen.getByRole('button', { name: `+${(1000).toLocaleString('pt')}` }))
    await user.click(screen.getByRole('button', { name: `+${(5000).toLocaleString('pt')}` }))
    await user.click(submit)

    await waitFor(() =>
      expect(calls).toEqual([{ activityType: 'STEPS', steps: 6000, source: 'MANUAL' }]),
    )
  })
})

describe('ActivityPage workout form', () => {
  function submitButton() {
    return screen.getByRole('button', { name: new RegExp(i18n.t('activity.registerWorkout')) })
  }

  it('refuses a workout with no measure at all', async () => {
    // Before the fix this posted a log with every measure null: a row worth zero
    // calories that still counted as an activity.
    const { user, calls } = mount()
    await screen.findByLabelText(i18n.t('activity.distance'))

    await user.click(submitButton())

    await expectAlert(i18n.t('activity.noMeasure'))
    expect(calls).toHaveLength(0)
  })

  it('refuses a negative distance', async () => {
    const { user, calls } = mount()

    await user.type(await screen.findByLabelText(i18n.t('activity.distance')), '-1')
    await user.click(submitButton())

    await expectAlert(i18n.t('activity.negativeMeasure'))
    expect(calls).toHaveLength(0)
  })

  it('logs a run with only its distance', async () => {
    const { user, calls } = mount()

    await user.type(await screen.findByLabelText(i18n.t('activity.distance')), '5')
    await user.click(submitButton())

    await waitFor(() =>
      expect(calls).toEqual([{ activityType: 'RUN', distanceKm: 5, source: 'MANUAL' }]),
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
