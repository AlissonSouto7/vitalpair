import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Anel de calorias, elemento-assinatura. Verde = saúde/meta.
 */
export function CalorieRing({
  current,
  goal,
  size = 134,
  legenda,
}: {
  current: number
  goal: number
  size?: number
  /**
   * Substitui o "de N kcal" de baixo.
   *
   * O anel nasceu para o painel do dia, onde "1.336 de 1.336" quer dizer que a pessoa comeu
   * a meta inteira. O onboarding o reusa cheio, para comemorar a meta recém-calculada, e ali
   * a mesma legenda afirma que ela já comeu tudo antes de registrar a primeira refeição.
   * Quem chama diz o que aquele número é.
   */
  legenda?: string
}) {
  const { t, i18n } = useTranslation()
  const pct = goal > 0 ? Math.min(1, current / goal) : 0
  const circumference = 314 // 2π·50
  const offset = circumference * (1 - pct)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="50" fill="none" strokeWidth="12" className="stroke-track" />
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          className="stroke-success"
          style={
            {
              '--vp-off': offset,
              animation: 'vp-ring-draw 1.1s cubic-bezier(.4,0,.2,1) both',
            } as CSSProperties
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-[30px] font-semibold leading-none tabular-nums text-ink">
          {current.toLocaleString(i18n.language)}
        </div>
        {/* "de" estava escrito em português dentro do componente, e o número formatado em
            pt-BR fixo: o anel dizia "de 2.211 kcal" no meio de uma tela em inglês. */}
        <div className="text-[10.5px] font-extrabold tracking-wide tabular-nums text-muted">
          {legenda ?? t('common.ofGoalKcal', { goal: goal.toLocaleString(i18n.language) })}
        </div>
      </div>
    </div>
  )
}
