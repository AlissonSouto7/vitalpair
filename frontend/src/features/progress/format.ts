/**
 * How weights and dates are written on the progress screen.
 *
 * Apart from the components because a file exporting both stops hot reload from working.
 */

export function fmtKg(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}
export function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
