import type { TFunction } from 'i18next'

import { IconPair, IconSolo } from './icons'
import { ActivityRow, MacroCell, ModeCard, StepHeader, StepWrap } from './StepParts'

import { CalorieRing } from '@/components/ui/CalorieRing'
import type { ActivityLevel, Tdee } from '@/types/profile'

type Mode = 'pair' | 'solo'

/**
 * Steps 2 to 5, lifted out of OnboardingPage with their markup untouched.
 *
 * Each takes what it renders as props and owns none of the flow's state, for the same
 * reason as StepAboutYou: the profile is sent to the server in one call when step 2 is
 * left, so the page has to keep it.
 */

/** Step 2: how active the person's day is. Leaving it is what asks the server to compute. */
export function StepRoutine({
  t,
  activityLevel,
  setActivityLevel,
  activityOptions,
}: {
  t: TFunction
  activityLevel: ActivityLevel | ''
  setActivityLevel: (value: ActivityLevel) => void
  activityOptions: { value: ActivityLevel; label: string; hint: string }[]
}) {
  return (
    <StepWrap>
      <StepHeader title={t('onboarding.step2Title')} subtitle={t('onboarding.step2Subtitle')} />
      <div className="flex flex-col gap-2.5">
        {activityOptions.map((a) => (
          <ActivityRow
            key={a.value}
            active={activityLevel === a.value}
            label={a.label}
            hint={a.hint}
            onClick={() => setActivityLevel(a.value)}
          />
        ))}
      </div>
    </StepWrap>
  )
}

/** Step 3: the targets the server worked out from the two steps before it. */
export function StepTargets({ t, tdee }: { t: TFunction; tdee: Tdee }) {
  return (
    <StepWrap>
      <div className="text-center">
        <p className="mb-1 font-display text-2xl font-semibold text-ink">
          {t('onboarding.step3Title')}
        </p>
        <p className="mb-5 text-sm font-semibold text-muted">{t('onboarding.step3Subtitle')}</p>

        <div className="mb-5 flex justify-center">
          <CalorieRing
            current={tdee.dailyCalorieTarget}
            goal={tdee.dailyCalorieTarget}
            size={200}
          />
        </div>

        <div className="mb-4 grid grid-cols-3 divide-x divide-hair overflow-hidden rounded-2xl border border-hair">
          <MacroCell
            label={t('onboarding.macroProtein')}
            grams={tdee.proteinTargetG}
            tone="brand"
          />
          <MacroCell label={t('onboarding.macroCarb')} grams={tdee.carbTargetG} tone="carb" />
          <MacroCell label={t('onboarding.macroFat')} grams={tdee.fatTargetG} tone="success" />
        </div>

        <p className="text-sm font-semibold leading-relaxed text-muted">
          {t('onboarding.step3Footnote')}
        </p>
      </div>
    </StepWrap>
  )
}

/** Step 4: with someone, or alone. */
export function StepPartner({
  t,
  inviteId,
  mode,
  setMode,
  inviteCode,
  setInviteCode,
}: {
  t: TFunction
  inviteId: string
  mode: Mode | null
  setMode: (value: Mode) => void
  inviteCode: string
  setInviteCode: (value: string) => void
}) {
  return (
    <StepWrap>
      <StepHeader title={t('onboarding.step4Title')} subtitle={t('onboarding.step4Subtitle')} />
      <div className="flex flex-col gap-3">
        <ModeCard active={mode === 'pair'} onClick={() => setMode('pair')} tone="rival">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-rival-soft text-rival">
              <IconPair className="h-[22px] w-[22px]" />
            </span>
            <div className="text-left">
              <div className="text-[15px] font-extrabold text-ink">
                {t('onboarding.modePairTitle')}
              </div>
              <div className="text-xs font-semibold text-muted">{t('onboarding.modePairHint')}</div>
            </div>
          </div>
          {mode === 'pair' && (
            <div className="mt-3 border-t border-hair pt-3 text-left">
              <label htmlFor={inviteId} className="label">
                {t('onboarding.inviteLabel')}
              </label>
              <input
                id={inviteId}
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                onClick={(e) => e.stopPropagation()}
                placeholder={t('onboarding.invitePlaceholder')}
                className="input font-display tracking-[0.12em]"
              />
              <p className="mt-2 text-[11.5px] font-semibold text-muted">
                {t('onboarding.inviteHint')}
              </p>
            </div>
          )}
        </ModeCard>

        <ModeCard active={mode === 'solo'} onClick={() => setMode('solo')} tone="brand">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-brand-soft text-brand">
              <IconSolo className="h-[22px] w-[22px]" />
            </span>
            <div className="text-left">
              <div className="text-[15px] font-extrabold text-ink">
                {t('onboarding.modeSoloTitle')}
              </div>
              <div className="text-xs font-semibold text-muted">{t('onboarding.modeSoloHint')}</div>
            </div>
          </div>
          {mode === 'solo' && (
            <div className="mt-3 border-t border-hair pt-3 text-left text-[11.5px] font-semibold text-muted">
              {t('onboarding.soloConfirm')}
            </div>
          )}
        </ModeCard>
      </div>
    </StepWrap>
  )
}

/** Step 5: what is at stake. */
export function StepBet({
  t,
  betId,
  mode,
  bet,
  setBet,
  betSuggestions,
}: {
  t: TFunction
  betId: string
  mode: Mode | null
  bet: string
  setBet: (value: string) => void
  betSuggestions: string[]
}) {
  return (
    <StepWrap>
      <StepHeader
        title={mode === 'solo' ? t('onboarding.step5TitleSolo') : t('onboarding.step5TitlePair')}
        subtitle={
          mode === 'solo' ? t('onboarding.step5SubtitleSolo') : t('onboarding.step5SubtitlePair')
        }
      />

      <label htmlFor={betId} className="label">
        {t('onboarding.betLabel')}
      </label>
      <input
        id={betId}
        type="text"
        value={bet}
        onChange={(e) => setBet(e.target.value)}
        className="input mb-3.5 border-brand focus:border-brand"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {betSuggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setBet(t('onboarding.betPrefix', { bet: s }))}
            className="rounded-full border border-hair bg-surface px-3 py-2 text-xs font-bold text-ink transition hover:border-brand/60"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-hair bg-surface px-4 py-4">
        <span className="font-display text-[13px] font-semibold text-muted">
          {t('onboarding.betDuration')}
        </span>
        <span className="h-px flex-1 bg-hair" />
        <span className="font-display text-[13px] font-semibold text-ink">
          {t('onboarding.betFootnote')}
        </span>
      </div>

      {/* TODO: backend de temporada/aposta — a aposta acima é só visual por enquanto. */}
    </StepWrap>
  )
}
