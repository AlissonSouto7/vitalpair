// Índice de i18n: junta todos os namespaces (um módulo por arquivo, cada um com
// { pt, en, es, fr }) no formato de resources do i18next.
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

type Lang = 'pt' | 'en' | 'es' | 'fr'

const modules = {
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

function bundle(lang: Lang): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [ns, mod] of Object.entries(modules)) {
    out[ns] = (mod as Record<Lang, unknown>)[lang]
  }
  return out
}

export const resources = {
  pt: { translation: bundle('pt') },
  en: { translation: bundle('en') },
  es: { translation: bundle('es') },
  fr: { translation: bundle('fr') },
}
