// Índice de i18n: junta todos os namespaces (um módulo por arquivo, cada um com
// { pt, en, es, fr }) no formato de resources do i18next.
import i18next from 'i18next'

import { activity } from './activity'
import { auth } from './auth'
import { common } from './common'
import { dashboard } from './dashboard'
import { errors } from './errors'
import { feed } from './feed'
import { gamification } from './gamification'
import { header } from './header'
import { landing } from './landing'
import { mealplan } from './mealplan'
import { missions } from './missions'
import { nav } from './nav'
import { notifications } from './notifications'
import { nutrition } from './nutrition'
import { onboarding } from './onboarding'
import { pair } from './pair'
import { profile } from './profile'
import { progress } from './progress'
import { season } from './season'
import { seasonEnd } from './seasonEnd'
import { settings } from './settings'
import { workoutplan } from './workoutplan'

export type Lang = 'pt' | 'en' | 'es' | 'fr'

const modules = {
  common,
  errors,
  nav,
  header,
  notifications,
  auth,
  onboarding,
  landing,
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

/**
 * The legal texts, loaded only when one of the three legal pages is opened.
 *
 * They are 69 kB of the 202 kB of translations, in four languages, for pages a person
 * visits once if ever. Keeping them in the main bundle made every visitor download the
 * terms of service to see the login form.
 */
export async function loadLegalNamespace(lang: Lang): Promise<void> {
  const { legal } = await import('./legal')
  i18next.addResourceBundle(lang, 'translation', { legal: legal[lang] }, true, true)
}

/** The namespaces of one language, in the shape i18next expects. */
export function bundle(lang: Lang): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [ns, mod] of Object.entries(modules)) {
    out[ns] = (mod as Record<Lang, unknown>)[lang]
  }
  return out
}

/**
 * Every language at once.
 *
 * Only the parity test uses this, which is the point: it compares the four bundles key by
 * key, so it has to see all of them. The application loads one language (see i18n.ts),
 * because shipping four costs every visitor three languages they will not read.
 */
export const resources = {
  pt: { translation: bundle('pt') },
  en: { translation: bundle('en') },
  es: { translation: bundle('es') },
  fr: { translation: bundle('fr') },
}
