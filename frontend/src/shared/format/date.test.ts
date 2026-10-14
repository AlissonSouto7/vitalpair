import { describe, expect, it } from 'vitest'

import { fmtShortDate, fmtWeekdayInitial } from './date'

describe('fmtShortDate', () => {
  it('writes the day and month the way the reader does', () => {
    // Not a translation of the same string: English puts the month first.
    expect(fmtShortDate('2026-10-13', 'pt-BR')).toBe('13 de out.')
    expect(fmtShortDate('2026-10-13', 'en')).toBe('Oct 13')
    expect(fmtShortDate('2026-10-13', 'es')).toBe('13 oct')
    expect(fmtShortDate('2026-10-13', 'fr')).toBe('13 oct.')
  })

  it('keeps the day the record was logged on, not the day before', () => {
    // The guard against UTC parsing: without the T00:00:00 this reads as 21:00 on the 12th
    // in Brasília, and every caption on the progress screen is off by one.
    expect(fmtShortDate('2026-01-01', 'pt-BR')).toBe('01 de jan.')
    expect(fmtShortDate('2026-03-01', 'en')).toBe('Mar 01')
  })

  it('falls back to the product language when none is given', () => {
    expect(fmtShortDate('2026-10-13')).toBe('13 de out.')
  })
})

describe('fmtWeekdayInitial', () => {
  it('writes the initial in the reader own language', () => {
    // 2026-10-12 é uma segunda-feira.
    expect(fmtWeekdayInitial('2026-10-12', 'pt-BR')).toBe('S')
    expect(fmtWeekdayInitial('2026-10-12', 'en')).toBe('M')
    expect(fmtWeekdayInitial('2026-10-12', 'fr')).toBe('L')
  })

  it('covers the whole week without drifting a day', () => {
    // A segunda a domingo de uma semana real, em inglês, onde as sete são distinguíveis.
    const week = ['12', '13', '14', '15', '16', '17', '18'].map((d) =>
      fmtWeekdayInitial(`2026-10-${d}`, 'en'),
    )
    expect(week).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S'])
  })

  it('reads the date at local midnight, not as UTC', () => {
    // Sem a guarda, 2026-10-12 em Brasília cai no domingo 11 e o eixo inteiro desanda.
    expect(fmtWeekdayInitial('2026-10-12', 'en')).toBe('M')
  })
})
