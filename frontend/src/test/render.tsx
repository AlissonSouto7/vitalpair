import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'

import i18n from '@/i18n'

/**
 * Renders a screen with the providers it has in the real application.
 *
 * Portuguese is forced rather than detected: jsdom reports `en-US` as the navigator
 * language, which would make every assertion depend on the English bundle while the
 * product's reference bundle is `pt`. Tests read expected text through `i18n.t` so they
 * follow a copy change instead of breaking on it.
 *
 * Retries are off. A test that expects a failure would otherwise wait through three
 * retries with exponential backoff before seeing it.
 */
export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  void i18n.changeLanguage('pt')
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const user = userEvent.setup()
  const result = render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
    options,
  )
  return { user, ...result }
}

export { i18n }
