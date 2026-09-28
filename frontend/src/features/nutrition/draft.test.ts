import { describe, expect, it } from 'vitest'

import { draftFromProduct, instantDaysAgo } from './draft'

import type { FoodProduct } from '@/types/nutrition'

/**
 * Logging a meal that was eaten on an earlier day.
 *
 * The streak, the point ledger and the weekly competition are all counted by date, so the day
 * a meal lands on is not cosmetic: yesterday's dinner recorded as today moves the points to the
 * wrong day and can fabricate a streak the person did not earn. The conversion from "yesterday"
 * to an instant is one line and is exactly where a timezone mistake hides, which is why it has
 * its own test instead of being asserted through the screen.
 */
describe('instantDaysAgo', () => {
  it('moves the date back and keeps the time of day', () => {
    const now = new Date('2026-09-28T15:30:00.000Z')

    expect(instantDaysAgo(1, now)).toBe('2026-09-27T15:30:00.000Z')
    expect(instantDaysAgo(2, now)).toBe('2026-09-26T15:30:00.000Z')
  })

  it('never lands on midnight, which is what would cross a timezone boundary', () => {
    /*
     * Midnight is the plausible implementation and the wrong one: 00:00 is the edge of the day,
     * so anybody in a zone behind UTC has the meal recorded against the day before the one they
     * picked. Keeping the current time puts it in the middle of the chosen day in every zone.
     */
    const now = new Date('2026-09-28T15:30:00.000Z')
    const result = new Date(instantDaysAgo(1, now))

    expect(result.getUTCHours()).not.toBe(0)
    expect(result.getUTCHours()).toBe(now.getUTCHours())
  })

  it('crosses a month boundary correctly', () => {
    // Subtracting from the day number is only safe because Date normalises it; asserting it
    // here means a hand-rolled "day - 1" cannot creep in later.
    const firstOfOctober = new Date('2026-10-01T12:00:00.000Z')

    expect(instantDaysAgo(1, firstOfOctober)).toBe('2026-09-30T12:00:00.000Z')
  })

  it('a fresh draft is for today, so nothing is sent', () => {
    const product: FoodProduct = {
      name: 'Arroz branco cozido',
      barcode: null,
      caloriesPer100g: 128,
      proteinPer100g: 2.5,
      carbPer100g: 28.1,
      fatPer100g: 0.2,
      category: 'STAPLE',
    }

    // The page only sends loggedAt when daysAgo is above zero. A default of anything else would
    // pin every meal to the device clock in exchange for nothing.
    expect(draftFromProduct(product, 'LUNCH').daysAgo).toBe(0)
  })
})
