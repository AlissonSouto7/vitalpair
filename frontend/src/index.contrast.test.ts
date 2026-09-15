import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * The colour tokens have to stay readable.
 *
 * This reads the real src/index.css rather than a copy of the palette, so a token edited there
 * is what gets measured. A copy would have passed while the stylesheet regressed, which is the
 * failure mode this exists to prevent.
 *
 * The light theme used to fail almost entirely and nobody noticed, because the manual screen
 * sweep ran in dark mode only. The worst case was white on the primary action button at
 * 2.84:1, below even the large-text floor, on every screen in the app.
 */

const CSS = readFileSync(join(__dirname, 'index.css'), 'utf8')

/** WCAG 2.1 relative luminance. */
function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const channel = (pair: string) => {
    const c = parseInt(pair, 16) / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  const [r, g, b] = [channel(h.slice(0, 2)), channel(h.slice(2, 4)), channel(h.slice(4, 6))]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Reads one theme's block out of the stylesheet and returns its hex tokens.
 *
 * Scoped to the block so the two themes cannot be confused: both define the same token names,
 * and matching the whole file would return whichever came last.
 */
function tokensOf(selector: ':root' | '.dark'): Record<string, string> {
  // The light block is the `:root` that carries --canvas, not the `@theme inline` one.
  const pattern = selector === ':root' ? /:root\s*\{([^}]*--canvas[^}]*)\}/ : /\.dark\s*\{([^}]*)\}/
  const block = pattern.exec(CSS)
  expect(block, `could not find the ${selector} block in index.css`).not.toBeNull()

  const found: Record<string, string> = {}
  for (const m of block![1].matchAll(/--([a-z-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) {
    found[m[1]] = m[2].toLowerCase()
  }
  return found
}

const LIGHT = tokensOf(':root')
const DARK = tokensOf('.dark')

/** Colours used as text. Normal-size body text, so the bar is 4.5:1. */
const TEXT_TOKENS = [
  'ink',
  'muted',
  'faint',
  'act-ink',
  'you-ink',
  'pair-ink',
  'success-ink',
  'carb-ink',
  'fat-ink',
]

/** Colours that fill a bar or a dot behind nothing. Graphic, so the bar is 3:1. */
const FILL_TOKENS = ['act', 'you', 'pair', 'success', 'carb', 'fat', 'danger']

/**
 * Fills that serve as the background of a filled button, whose label needs 4.5:1.
 *
 * The label is `--on-fill`, not white: in the dark theme the fills are light on purpose, and a
 * white label on them measured 2.34:1 on brand and 1.74:1 on success, which is unreadable. The
 * token is white in the light theme and near-black in the dark one.
 *
 * carb and fat are deliberately absent: neither is ever a button background (grep for
 * `bg-carb`/`bg-fat` alongside a label colour finds nothing), so holding them to a button
 * threshold would darken them for a case that does not exist.
 *
 * `you` and `pair` are absent for a different reason, and it is a rule rather than an
 * omission: the two people's colours must never become a button. If "you" were the action
 * colour, you would carry the weight of the whole system and your partner would not, in a
 * product whose premise is that the two of you compete on equal terms. Button.test.tsx
 * holds that rule from the other side.
 */
const FILLED_BUTTON_TOKENS = ['act', 'success', 'danger']

describe.each([
  ['light', LIGHT],
  ['dark', DARK],
])('%s theme', (name, tokens) => {
  it('defines every token the tests measure', () => {
    for (const token of [...TEXT_TOKENS, ...FILL_TOKENS, 'on-fill']) {
      expect(tokens[token], `${name}: --${token} is missing or not a 6-digit hex`).toMatch(
        /^#[0-9a-f]{6}$/,
      )
    }
  })

  it.each(TEXT_TOKENS)('%s is readable as text on both backgrounds', (token) => {
    for (const bg of ['surface', 'canvas'] as const) {
      const ratio = contrast(tokens[token], tokens[bg])
      expect(
        ratio,
        `${name}: --${token} ${tokens[token]} on --${bg} ${tokens[bg]} is ${ratio.toFixed(2)}:1, under 4.5`,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  it.each(FILL_TOKENS)('%s is visible as a fill against the track', (token) => {
    const ratio = contrast(tokens[token], tokens.track)
    expect(
      ratio,
      `${name}: --${token} ${tokens[token]} on --track ${tokens.track} is ${ratio.toFixed(2)}:1, under 3`,
    ).toBeGreaterThanOrEqual(3)
  })

  it.each(FILLED_BUTTON_TOKENS)('%s carries the filled-button label', (token) => {
    const ratio = contrast(tokens['on-fill'], tokens[token])
    expect(
      ratio,
      `${name}: --on-fill ${tokens['on-fill']} on --${token} ${tokens[token]} is ${ratio.toFixed(2)}:1, under 4.5`,
    ).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps the ink then muted then faint hierarchy', () => {
    // Light theme dims by going lighter, dark theme by going darker, so the direction flips.
    const [ink, muted, faint] = [tokens.ink, tokens.muted, tokens.faint].map(luminance)
    if (name === 'light') {
      expect(ink).toBeLessThan(muted)
      expect(muted).toBeLessThan(faint)
    } else {
      expect(ink).toBeGreaterThan(muted)
      expect(muted).toBeGreaterThan(faint)
    }
  })
})
