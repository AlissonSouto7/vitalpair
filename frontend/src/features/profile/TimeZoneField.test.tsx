import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { TFunction } from 'i18next'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TimeZoneField } from './TimeZoneField'

/**
 * The translations are not what is under test here, so the key is echoed with its values.
 *
 * Cast because TFunction is branded: a plain function is not one, and this is a stub that
 * only has to be called, not a translator that has to resolve keys.
 */
const t = ((key: string, opts?: Record<string, unknown>) =>
  opts ? `${key}:${Object.values(opts).join(',')}` : key) as unknown as TFunction

/** Pretends the browser is somewhere, which is the only input this component reads. */
function browserIn(zone: string) {
  vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
    resolvedOptions: () => ({ timeZone: zone }),
  } as unknown as Intl.DateTimeFormat)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TimeZoneField', () => {
  it('says nothing when the account and the device agree', () => {
    browserIn('America/Sao_Paulo')
    render(<TimeZoneField value="America/Sao_Paulo" onChange={() => {}} t={t} />)

    expect(screen.getByText('America/Sao_Paulo')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('offers the device zone when the two disagree', async () => {
    const user = userEvent.setup()
    browserIn('Europe/Lisbon')
    const onChange = vi.fn()
    render(<TimeZoneField value="America/Sao_Paulo" onChange={onChange} t={t} />)

    expect(screen.getByText(/timeZoneMismatch/)).toHaveTextContent(
      'Europe/Lisbon,America/Sao_Paulo',
    )

    // Offered, never applied on its own: someone travelling for a week should not have their
    // day boundary moved without saying so.
    expect(onChange).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button'))
    expect(onChange).toHaveBeenCalledWith('Europe/Lisbon')
  })

  it('says nothing when the browser will not name a zone', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('no Intl here')
    })
    render(<TimeZoneField value="America/Sao_Paulo" onChange={() => {}} t={t} />)

    // A browser that cannot answer is not evidence the stored zone is wrong, so there is
    // nothing to suggest and the field stays quiet.
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
