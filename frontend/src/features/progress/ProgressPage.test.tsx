import { screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { ProgressPage } from './ProgressPage'

import { progressFixture } from '@/test/fixtures'
import { fail, ok, path, recording } from '@/test/msw/api'
import { server } from '@/test/msw/server'
import { i18n, renderWithProviders } from '@/test/render'


/**
 * The weight form on the progress screen.
 *
 * Every refusal is proved twice: the message is on screen, and the request never left.
 * A message alone would pass with a form that shows the text and posts anyway.
 */
function mount() {
  server.use(http.get(path('/progress'), () => ok(progressFixture)))
  return renderWithProviders(<ProgressPage />)
}

async function weightInput() {
  return screen.findByLabelText(i18n.t('progress.logTodayLabel'))
}

function submitButton() {
  return screen.getByRole('button', { name: i18n.t('progress.logButton') })
}

describe('ProgressPage weight form', () => {
  it('refuses an empty weight and sends nothing', async () => {
    const { handler, calls } = recording('post', '/progress/weight')
    server.use(handler)
    const { user } = mount()
    await weightInput()

    await user.click(submitButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('progress.weightInvalid'))
    expect(calls).toHaveLength(0)
  })

  it('refuses zero', async () => {
    const { handler, calls } = recording('post', '/progress/weight')
    server.use(handler)
    const { user } = mount()

    await user.type(await weightInput(), '0')
    await user.click(submitButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('progress.weightInvalid'))
    expect(calls).toHaveLength(0)
  })

  it('refuses a weight no person has', async () => {
    const { handler, calls } = recording('post', '/progress/weight')
    server.use(handler)
    const { user } = mount()

    await user.type(await weightInput(), '1000')
    await user.click(submitButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('progress.weightInvalid'))
    expect(calls).toHaveLength(0)
  })

  it('sends a valid weight as a number and reloads the chart', async () => {
    const { handler, calls } = recording<{ weightKg: number }>('post', '/progress/weight')
    let reads = 0
    server.use(
      handler,
      http.get(path('/progress'), () => {
        reads++
        return ok(progressFixture)
      }),
    )
    const { user } = renderWithProviders(<ProgressPage />)

    await user.type(await weightInput(), '78.5')
    await user.click(submitButton())

    await waitFor(() => expect(calls).toEqual([{ weightKg: 78.5 }]))
    // One read to render, one after the write.
    await waitFor(() => expect(reads).toBe(2))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows what the server said when saving fails', async () => {
    server.use(http.post(path('/progress/weight'), () => fail(500, 'Erro interno')))
    const { user } = mount()

    await user.type(await weightInput(), '80')
    await user.click(submitButton())

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro interno')
  })
})
