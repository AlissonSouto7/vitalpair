/**
 * How a weight is written on the profile.
 *
 * Apart from the components because a file exporting both stops hot reload from working.
 */

/** One decimal, Brazilian style: 78,5 rather than 78.5. */

export function fmtKg(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}
