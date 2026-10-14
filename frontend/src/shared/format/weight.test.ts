import { describe, expect, it } from 'vitest'

import { fmtKg } from './weight'

/**
 * The locale used to be hardcoded to pt-BR here, which put a comma in a weight on an
 * otherwise English screen. The dashboard had already been fixed the same way, by taking
 * the locale as an argument, and the fix had not reached the profile or the progress screen.
 */
describe('fmtKg', () => {
  it('always shows one decimal, so 78 and 78.5 line up in a column', () => {
    expect(fmtKg(78, 'pt-BR')).toBe('78,0')
    expect(fmtKg(78.5, 'pt-BR')).toBe('78,5')
  })

  it('writes the separator the reader expects', () => {
    expect(fmtKg(78.5, 'pt-BR')).toBe('78,5')
    expect(fmtKg(78.5, 'en')).toBe('78.5')
    expect(fmtKg(78.5, 'es')).toBe('78,5')
    expect(fmtKg(78.5, 'fr')).toBe('78,5')
  })

  it('rounds to the decimal shown rather than truncating', () => {
    expect(fmtKg(78.46, 'en')).toBe('78.5')
    expect(fmtKg(78.44, 'en')).toBe('78.4')
  })

  it('falls back to the product language when none is given', () => {
    // Callers inside a component pass i18n.language. A caller that cannot reach it still
    // gets a sane number rather than a crash.
    expect(fmtKg(78.5)).toBe('78,5')
  })
})
