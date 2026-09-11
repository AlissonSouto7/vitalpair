import { describe, expect, it } from 'vitest'

import { legal } from './legal'

import { modules } from './index'

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
 *
 * The list of namespaces comes from `index.ts` rather than being repeated here. It was
 * repeated, and the copy fell behind: `errors` and `premium` shipped to users while this
 * test believed there were 22 namespaces and asserted `>= 22`, so the guard against
 * exactly that mistake passed while the mistake was live. Importing the real list makes
 * the omission impossible instead of detectable.
 */

/** The on-demand namespace, which is not in `modules` but ships to users all the same. */
const namespaces = { ...modules, legal }

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
  it('carries every language for every namespace', () => {
    // Not a count: the names themselves. A namespace added to index.ts arrives here on its
    // own, and one whose bundle is missing a language fails by name rather than by arithmetic.
    const incomplete = Object.entries(namespaces)
      .filter(([, bundle]) =>
        (['pt', ...translated] as const).some(
          (lang) => (bundle as Record<string, unknown>)[lang] === undefined,
        ),
      )
      .map(([name]) => name)

    expect(incomplete, 'namespaces missing at least one language').toEqual([])
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
