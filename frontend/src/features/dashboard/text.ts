/**
 * How the dashboard words and formats things.
 *
 * Separate from the components because a file that exports both stops hot reload from
 * working: React cannot tell a changed component from a changed helper, so it reloads the
 * page instead of swapping the component.
 */

/** The shape of the translate function these take. */
export type TFn = (key: string, opts?: Record<string, unknown>) => string

export function greeting(t: TFn): string {
  const h = new Date().getHours()
  if (h < 12) return t('dashboard.greetingMorning')
  if (h < 18) return t('dashboard.greetingAfternoon')
  return t('dashboard.greetingEvening')
}

export function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || 'A'
}

/**
 * The day, written the way the reader's language writes it.
 *
 * <p>This was hardcoded to pt-BR, which put "Domingo · 6 de setembro" at the top of an
 * otherwise English screen. Intl already knows every locale's order and separators, so the
 * only thing worth keeping by hand is the leading capital, which pt and fr do not apply to
 * weekday names and the design does.
 */
export function dateLabel(iso: string, locale: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const label = date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function timeAgo(iso: string, t: TFn): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return t('dashboard.timeNow')
  if (min < 60) return t('dashboard.timeMin', { n: min })
  const h = Math.floor(min / 60)
  if (h < 24) return t('dashboard.timeHour', { n: h })
  return t('dashboard.timeDay', { n: Math.floor(h / 24) })
}

/* ---------- ícones ---------- */
