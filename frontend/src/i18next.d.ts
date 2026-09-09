import 'i18next'

import type { TranslationBundle } from './locales'

/**
 * Makes every translation key a compile-time fact.
 *
 * Without this, `t('onboarding.tittle')` builds, ships, and shows the raw key on screen in
 * production, and the only thing that can notice is a person. With it the key is a union
 * derived from the pt bundle, so a misspelling, a key that was renamed, or one that was
 * never added fails `tsc` in the file that uses it, before the change is even committed.
 *
 * The parity test still has a job: it proves en, es and fr carry the same keys as pt. This
 * file proves the code only asks for keys pt has. Together they mean a key that resolves
 * in one language resolves in all four.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: TranslationBundle
    }
  }
}
