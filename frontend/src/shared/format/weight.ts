/**
 * How a weight is written.
 *
 * One decimal: 78,5 rather than 78.5. The profile and the progress screen each had a
 * byte-identical copy of this, down to the same sentence in their file comments, which is how
 * two screens end up disagreeing about a number after one of them is "improved".
 *
 * KNOWN DEFECT, deliberately preserved here: the locale is hardcoded. Measured, 78.5 is
 * written "78,5" in pt, es and fr and "78.5" in en, so a reader in English sees the comma.
 * `fmtDate` on the progress screen is worse, giving "13 de out." where English wants
 * "Oct 13". The dashboard already fixed this for its own date by taking a `locale` argument,
 * and the fix did not reach here. Fixing it means threading the locale through the progress
 * and profile screens, which is a behaviour change, not a move, so it is not done in the same
 * breath as removing a duplicate.
 */
export function fmtKg(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}
