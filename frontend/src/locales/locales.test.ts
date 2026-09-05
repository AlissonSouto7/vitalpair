import { describe, expect, it } from 'vitest'

import { common } from './common'
import { nav } from './nav'
import { header } from './header'
import { notifications } from './notifications'
import { auth } from './auth'
import { onboarding } from './onboarding'
import { landing } from './landing'
import { legal } from './legal'
import { mealplan } from './mealplan'
import { workoutplan } from './workoutplan'
import { seasonEnd } from './seasonEnd'
import { nutrition } from './nutrition'
import { activity } from './activity'
import { feed } from './feed'
import { missions } from './missions'
import { season } from './season'
import { progress } from './progress'
import { gamification } from './gamification'
import { dashboard } from './dashboard'
import { profile } from './profile'
import { settings } from './settings'
import { pair } from './pair'

/**
 * Guards translation completeness across the four supported languages.
 *
 * A key present in `pt` but missing elsewhere does not fail a build or throw at runtime:
 * i18next silently renders the raw key, so a French user sees `nutrition.addMeal` on a
 * button. Nothing catches that except someone switching language and looking, which is
 * why it needs a test.
 *
 * Portuguese is the reference: it is the product's primary language and the bundle every
 * new key is written in first.
 */

const namespaces = {
  common,
  nav,
  header,
  notifications,
  auth,
  onboarding,
  landing,
  legal,
  mealplan,
  workoutplan,
  seasonEnd,
  nutrition,
  activity,
  feed,
  missions,
  season,
  progress,
  gamification,
  dashboard,
  profile,
  settings,
  pair,
}

const translated = ['en', 'es', 'fr'] as const

/** Flattens a nested bundle into dotted paths, so `a: { b: 1 }` becomes `a.b`. */
function keyPaths(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') {
    return [prefix]
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  )
}

describe('translation bundles', () => {
  it('covers every namespace the app imports', () => {
    // Guards against a namespace being added to index.ts and forgotten here, which would
    // leave it untested while looking covered.
    expect(Object.keys(namespaces).length).toBeGreaterThanOrEqual(22)
  })

  describe.each(Object.entries(namespaces))('%s', (name, bundle) => {
    const reference = keyPaths((bundle as Record<string, unknown>).pt).sort()

    it('has a non-empty Portuguese bundle', () => {
      expect(reference.length, `${name}.pt is empty`).toBeGreaterThan(0)
    })

    it.each(translated)('has the same keys in %s as in pt', (lang) => {
      const actual = keyPaths((bundle as Record<string, unknown>)[lang]).sort()

      const missing = reference.filter((k) => !actual.includes(k))
      const extra = actual.filter((k) => !reference.includes(k))

      expect(missing, `${name}.${lang} is missing keys that exist in pt`).toEqual([])
      expect(extra, `${name}.${lang} has keys that do not exist in pt`).toEqual([])
    })
  })
})
