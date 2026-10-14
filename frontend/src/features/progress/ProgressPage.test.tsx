import { act, screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

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

describe('ProgressPage in another language', () => {
  /**
   * Both numbers on this screen were formatted with pt-BR hardcoded, so an English reader
   * saw "78,5 kg" and "01 de set." while the dashboard beside it wrote "78.5". The point of
   * these two tests is the comparison: the same fixture, rendered in two languages, has to
   * come out differently.
   *
   * The language is switched after the render, not before, because renderWithProviders
   * forces pt on purpose: jsdom reports en-US and every other test reads its expected text
   * through i18n.t. Switching afterwards is also what actually happens in the product, when
   * somebody changes the language in the settings.
   */
  const halfKilo = {
    ...progressFixture,
    weights: [
      { date: '2026-09-01', weightKg: 79 },
      { date: '2026-09-07', weightKg: 78.5 },
    ],
  }

  async function mountIn(language: string) {
    server.use(http.get(path('/progress'), () => ok(halfKilo)))
    const r = renderWithProviders(<ProgressPage />)
    await screen.findAllByText(/kg/)
    await act(async () => {
      await i18n.changeLanguage(language)
    })
    return r
  }

  afterEach(async () => {
    await i18n.changeLanguage('pt')
  })

  it('writes the weight and the date the Brazilian way in Portuguese', async () => {
    await mountIn('pt')

    expect(screen.getByText(/78,5/)).toBeInTheDocument()
    // The caption under the chart, which is the one that carries the first weighing's date.
    expect(screen.getAllByText(/01 de set\./).length).toBeGreaterThan(0)
  })

  it('writes them the English way in English', async () => {
    await mountIn('en')

    // A full stop rather than a comma, and the month before the day.
    expect(screen.getByText(/78\.5/)).toBeInTheDocument()
    expect(screen.getAllByText(/Sep 01/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/01 de set\./)).not.toBeInTheDocument()
  })
})
