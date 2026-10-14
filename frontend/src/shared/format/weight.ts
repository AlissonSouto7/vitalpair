/**
 * How a weight is written.
 *
 * One decimal always, so a column of weights lines up: 78 reads as "78,0" next to "78,5".
 *
 * The locale is the caller's, not this module's. It used to be hardcoded to pt-BR, which
 * wrote "78,5" on an English screen while the number beside it, formatted by the dashboard,
 * wrote "78.5". Components pass `i18n.language`; the default keeps the product's own
 * language for a caller that has no access to it.
 *
 * The profile and the progress screen each had a byte-identical copy of this, down to the
 * same sentence in their file comments, which is how two screens end up disagreeing about
 * the same number after one of them is "improved".
 */
export function fmtKg(v: number, locale = 'pt-BR'): string {
  return v.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}
