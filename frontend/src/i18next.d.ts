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
 *
 * DO NOT DELETE, and do not trust a tool that calls it unused: nothing imports it, because
 * the compiler picks it up from `include` and applies it to the whole project. Measured by
 * moving it out of src/ and running `npm run typecheck`: 2 type errors appear and every
 * `t()` call silently loses its key checking. It is in knip.json's `ignore` for this reason.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: TranslationBundle
    }
  }
}
