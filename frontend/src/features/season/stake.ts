import type { TFunction } from 'i18next'

/**
 * O texto que o servidor grava numa temporada cuja aposta ninguém escolheu.
 *
 * Vive em SeasonService.DEFAULT_STAKE, em português, porque é o valor inicial da coluna e
 * não uma escolha de ninguém: o onboarding ainda não tem temporada para prender a aposta,
 * então toda temporada nasce com ele. Numa tela em inglês aparecia "Quem perder paga o
 * jantar" no meio dos cartões.
 */
const SERVER_DEFAULT = 'Quem perder paga o jantar'

/**
 * A aposta como ela deve ser lida na tela.
 *
 * Só o valor padrão é traduzido, nunca o resto. A aposta é texto que a pessoa escreve, e
 * traduzir campo livre significaria reescrever o que ela combinou com o par: quem apostou
 * "quem perder lava a louça a semana toda" tem que ler exatamente isso, em qualquer idioma.
 */
export function stakeText(stake: string, t: TFunction): string {
  return stake === SERVER_DEFAULT ? t('season.stakeDefault') : stake
}
