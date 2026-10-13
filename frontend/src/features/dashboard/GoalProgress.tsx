import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { FlameIcon } from './icons'

import { Card } from '@/components/ui/Card'
import type { Level } from '@/types/gamification'
import type { Goal } from '@/types/profile'

/**
 * O topo do painel: quanto falta para o objetivo, e o esforço acumulado ao lado.
 *
 * O painel falava só de hoje. Seis dias de uso, com peso caindo e sequência de seis,
 * mostravam quanto ela comeu e quanto faltava para o dia, e nada dizia que ela estava
 * progredindo. A tela de progresso chegava a mostrar "registra de novo daqui uns dias que a
 * linha começa a desenhar" para quem já tinha registrado seis dias seguidos.
 *
 * Três informações, três coisas diferentes, e é por isso que elas convivem sem competir:
 * a barra é o objetivo (onde ela quer chegar), o nível é o esforço acumulado (o que ela já
 * fez), e a chama é a constância (o que ela não quer quebrar). Nível e chama ficam como selos
 * pequenos, porque a pergunta que traz a pessoa aqui é a primeira.
 */

/** Uma casa decimal, que é a precisão de uma balança doméstica. */
const kg = (v: number, lang: string) =>
  v.toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function GoalProgress({
  goal,
  startWeightKg,
  currentWeightKg,
  targetWeightKg,
  level,
  streakDays,
}: {
  goal: Goal | null
  /** O primeiro peso registrado, que é de onde a jornada começou. */
  startWeightKg: number | null
  currentWeightKg: number | null
  targetWeightKg: number | null
  level: Level | null
  streakDays: number
}) {
  const { t, i18n } = useTranslation()

  const selos = (
    <div className="flex shrink-0 items-center gap-2">
      {level && (
        <Link
          to="/gamification"
          className="rounded-lg bg-track px-2.5 py-1 text-[11px] font-extrabold text-muted transition hover:text-ink"
        >
          {t('dashboard.levelShort', { level: level.level })}
        </Link>
      )}
      {streakDays > 0 && (
        <span className="inline-flex items-center gap-1 rounded-lg bg-act-soft px-2.5 py-1 text-[11px] font-extrabold text-act-ink">
          {/* Sem className este ícone sai preto e sem tamanho: o viewBox sozinho não define
              nenhum dos dois, e o fill herda o padrão do navegador. */}
          <FlameIcon className="h-3.5 w-3.5 fill-act" />
          {streakDays}
        </span>
      )}
    </div>
  )

  /*
   * Sem alvo, a barra não existe: não há de onde nem para onde.
   *
   * É o caso de quem escolheu manter o peso, de quem não quis dizer, e de quem tem conta
   * antiga. Em vez de esconder o cartão, ele convida a definir, porque quem não sabe que pode
   * definir nunca vai procurar. O nível e a chama continuam, que é o que ela tem hoje.
   */
  if (goal === 'MAINTAIN' || goal === 'IMPROVE_FITNESS' || targetWeightKg == null) {
    return (
      <Card as="section" padding="tight">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted">
              {t('dashboard.goalLabel')}
            </p>
            <p className="mt-0.5 truncate text-sm font-bold text-ink">
              {level
                ? t('dashboard.levelPoints', { points: level.points })
                : t('dashboard.noGoalYet')}
            </p>
          </div>
          {selos}
        </div>
        {targetWeightKg == null && goal !== 'MAINTAIN' && goal !== 'IMPROVE_FITNESS' && (
          <Link
            to="/profile"
            className="mt-3 block rounded-xl border border-dashed border-edge px-3 py-2 text-center text-[13px] font-bold text-brand-ink transition hover:bg-brand-soft"
          >
            {t('dashboard.setTargetCta')}
          </Link>
        )}
      </Card>
    )
  }

  /*
   * De onde a jornada começou.
   *
   * O peso do primeiro registro, e não o do perfil: o do perfil é atualizado a cada pesagem,
   * então usá-lo faria a barra medir de "hoje" até o alvo e nunca sair do lugar, por mais que
   * a pessoa avançasse. Sem histórico, o peso atual serve de partida e a barra começa em zero,
   * que é a verdade no primeiro dia.
   */
  const partida = startWeightKg ?? currentWeightKg
  const atual = currentWeightKg
  if (partida == null || atual == null) {
    return null
  }

  const total = Math.abs(targetWeightKg - partida)
  const andado = Math.abs(atual - partida)
  // Quem foi na direção contrária está em zero, não em número negativo: a barra mostra o
  // progresso, e o retrocesso já aparece no número do peso logo acima dela.
  const naDirecaoCerta = targetWeightKg < partida ? atual <= partida : atual >= partida
  const percent =
    total === 0 ? 100 : Math.min(100, Math.round(((naDirecaoCerta ? andado : 0) / total) * 100))
  const faltam = Math.abs(targetWeightKg - atual)
  const chegou = targetWeightKg < partida ? atual <= targetWeightKg : atual >= targetWeightKg

  return (
    <Card as="section" padding="tight">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted">
            {t('dashboard.goalLabel')}
          </p>
          <p className="mt-0.5 font-display text-xl font-semibold tabular-nums text-ink">
            {t('dashboard.goalRange', {
              from: kg(partida, i18n.language),
              to: kg(targetWeightKg, i18n.language),
            })}
          </p>
        </div>
        {selos}
      </div>

      {/*
        A barra em verde: aqui ela significa progresso concreto em direção ao objetivo, que é
        exatamente o que a cor quer dizer no resto do produto. O trilho fica no cinza neutro.
      */}
      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('dashboard.goalLabel')}
      >
        <div
          className="h-full rounded-full bg-success transition-[width] duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2 text-[12.5px] font-bold text-muted">
        {chegou
          ? t('dashboard.goalReached')
          : t('dashboard.goalProgress', {
              done: kg(naDirecaoCerta ? andado : 0, i18n.language),
              total: kg(total, i18n.language),
              left: kg(faltam, i18n.language),
            })}
      </p>
    </Card>
  )
}
