/**
 * How a short date is written: the day and the month, for an axis label or a caption.
 *
 * The locale is the caller's. Hardcoded to pt-BR, as it was on the progress screen, this
 * produced "13 de out." under an English chart, where the reader expects "Oct 13": the
 * month order itself differs, not only its name, so there is no translating around it.
 *
 * The ISO date is read at midnight local time on purpose. `new Date('2026-10-13')` is
 * parsed as UTC, which in Brasília is 21:00 on the 12th, and a weighing logged on the 13th
 * would be captioned as the day before.
 */
export function fmtShortDate(iso: string, locale = 'pt-BR'): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short' })
}

/**
 * A inicial do dia da semana, para o eixo de um gráfico.
 *
 * Vinha pronta do servidor, montada de um vetor em português, então uma tela em inglês
 * mostrava "S T Q Q S S D". Pior: em português essas iniciais são ambíguas, porque S e Q
 * aparecem duas vezes cada. Aqui o Intl responde pelo idioma de quem lê, e em inglês as
 * sete iniciais são distintas de verdade (M T W T F S S).
 */
export function fmtWeekdayInitial(iso: string, locale = 'pt-BR'): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString(locale, { weekday: 'narrow' })
}
