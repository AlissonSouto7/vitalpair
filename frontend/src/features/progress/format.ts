/**
 * How a date is written on the progress screen.
 *
 * Apart from the components because a file exporting both stops hot reload from working.
 * `fmtKg` moved to shared/format/weight.ts, where the profile screen's identical copy of it
 * went as well; the hardcoded locale here is described there.
 */

export function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
