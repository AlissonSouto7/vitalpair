import { describe, expect, it } from 'vitest'

import { weightVerdict, weightVerdictClass } from './weightVerdict'

/**
 * The rule the whole product rests on: two people, opposite goals, same screen.
 *
 * Every case here was wrong before, because the screens asked "did the number go down?" instead
 * of "is this what they are training for?". A fixed rule is necessarily wrong for one half of
 * any pair that is not both cutting.
 */
describe('weightVerdict', () => {
  it('reads a loss as progress for somebody cutting', () => {
    expect(weightVerdict(-1.6, 'LOSE_WEIGHT')).toBe('toward')
  })

  it('reads a gain as progress for somebody bulking', () => {
    // The case from the sweep: Bel, GAIN_MUSCLE, 58.20 to 59.80 kg, which the app painted
    // orange as if it were a problem.
    expect(weightVerdict(1.6, 'GAIN_MUSCLE')).toBe('toward')
  })

  it('reads a gain as drift for somebody cutting', () => {
    expect(weightVerdict(1.6, 'LOSE_WEIGHT')).toBe('away')
  })

  it('reads a loss as drift for somebody bulking', () => {
    // Losing weight is the failure case here, and it used to be painted success green.
    expect(weightVerdict(-1.6, 'GAIN_MUSCLE')).toBe('away')
  })

  it('gives opposite verdicts to the two halves of a pair on the same number', () => {
    // This is the premise of the product stated as a test: one number, two people, two answers.
    expect(weightVerdict(2, 'GAIN_MUSCLE')).toBe('toward')
    expect(weightVerdict(2, 'LOSE_WEIGHT')).toBe('away')
  })

  it('treats any real movement as drift when the goal is to maintain', () => {
    expect(weightVerdict(1.2, 'MAINTAIN')).toBe('away')
    expect(weightVerdict(-1.2, 'MAINTAIN')).toBe('away')
  })

  it('calls a change below the noise floor steady, whatever the goal', () => {
    // A scale reads differently morning to evening; 100g is not news.
    expect(weightVerdict(0.1, 'LOSE_WEIGHT')).toBe('steady')
    expect(weightVerdict(-0.2, 'GAIN_MUSCLE')).toBe('steady')
    expect(weightVerdict(0, 'MAINTAIN')).toBe('steady')
  })

  it('passes no judgement when it has not been told the goal', () => {
    // Better to show the number plainly than to praise or warn at random.
    expect(weightVerdict(2, null)).toBe('steady')
    expect(weightVerdict(-2, undefined)).toBe('steady')
    expect(weightVerdict(2, 'IMPROVE_FITNESS')).toBe('steady')
  })
})

describe('weightVerdictClass', () => {
  it('uses green for progress and amber for drift, never the brand orange', () => {
    expect(weightVerdictClass('toward')).toBe('text-success-ink')
    // Amber and not brand: orange is the primary action colour everywhere else, so a gain
    // painted with it looked like something to tap rather than something to notice.
    expect(weightVerdictClass('away')).toBe('text-carb-ink')
    expect(weightVerdictClass('steady')).toBe('text-muted')
  })
})
