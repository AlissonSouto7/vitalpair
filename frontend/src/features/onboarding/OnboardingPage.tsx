import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useId } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { joinPair } from '../../api/pair'
import { getTdee, updateProfile } from '../../api/profile'
import { BrandMark } from '../../components/brand/BrandMark'
import { useTheme } from '../../hooks/useTheme'
import type { Tdee } from '../../types/profile'

import { ABOUT_YOU_FIELDS, onboardingSchema, type OnboardingValues } from './onboardingForm'
import { buildActivityOptions, buildGoalOptions, buildSexOptions, buildStepLabels } from './options'
import { StepAboutYou } from './StepAboutYou'
import { StepBet, StepPartner, StepRoutine, StepTargets } from './Steps'

import { getApiErrorMessage } from '@/shared/api/errors'

const TOTAL_STEPS = 5

type Mode = 'pair' | 'solo'

export function OnboardingPage() {
  const { t } = useTranslation()
  const inviteId = useId()
  const betId = useId()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  const STEP_LABELS = buildStepLabels(t)
  const SEX_OPTIONS = buildSexOptions(t)
  const GOAL_OPTIONS = buildGoalOptions(t)
  const ACTIVITY_OPTIONS = buildActivityOptions(t)
  const BET_SUGGESTIONS = [
    t('onboarding.betSuggestionDinner'),
    t('onboarding.betSuggestionMovie'),
    t('onboarding.betSuggestionDishes'),
  ]

  const [step, setStep] = useState(1)

  // Steps 1 and 2 are one form: the profile, sent in a single request when step 2 is
  // left. It lives here rather than in the steps so that going back shows what was typed.
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onTouched',
    defaultValues: { name: '', birthDate: '' },
  })
  const { isSubmitting: calculating } = form.formState

  // passo 3 (resultado)
  const [tdee, setTdee] = useState<Tdee | null>(null)

  // passo 4
  const [mode, setMode] = useState<Mode | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)

  // passo 5
  const [bet, setBet] = useState<string>(t('onboarding.betDefault'))

  const [error, setError] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)

  async function goNext() {
    setError(null)

    // Only this step's fields: the routine is not on screen yet, so it cannot be answered.
    if (step === 1 && !(await form.trigger(ABOUT_YOU_FIELDS))) {
      setError(t('onboarding.errorStep1'))
      return
    }

    // Leaving step 2 saves the profile and computes the target. The whole form is checked
    // here; step 1 was checked on the way in, so the routine is what can still be missing.
    if (step === 2) {
      await form.handleSubmit(saveProfileAndCalc, (errors) =>
        setError(errors.activityLevel ? t('onboarding.errorStep2') : t('onboarding.errorStep1')),
      )()
      return
    }

    // passo 4: se escolheu par e digitou código, entra no par
    if (step === 4) {
      if (!mode) {
        setError(t('onboarding.errorStep4'))
        return
      }
      if (mode === 'pair' && inviteCode.trim().length > 0) {
        const ok = await tryJoinPair()
        if (!ok) return
      }
    }

    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1)
    } else {
      void finish()
    }
  }

  function goBack() {
    setError(null)
    setStep((s) => Math.max(1, s - 1))
  }

  async function saveProfileAndCalc(values: OnboardingValues) {
    try {
      await updateProfile(values)
      const result = await getTdee()
      setTdee(result)
      setStep(3)
    } catch (err) {
      setError(getApiErrorMessage(err, t('onboarding.errorCalc')))
    }
  }

  async function tryJoinPair(): Promise<boolean> {
    setJoining(true)
    setError(null)
    try {
      await joinPair(inviteCode.trim())
      return true
    } catch (err) {
      setError(getApiErrorMessage(err, t('onboarding.errorJoin')))
      return false
    } finally {
      setJoining(false)
    }
  }

  /**
   * The last step: the stake, and into the app.
   *
   * The stake is not persisted here, and that is deliberate rather than forgotten. A
   * season only exists once there is a pair, and this step is reached by people going
   * solo as well; `PUT /api/v1/season/stake` needs a season to attach to. Someone who
   * pairs up sets the stake on the season screen, where the season is real. The field
   * here is a prompt, not a form: it gets people thinking about what they are playing for.
   *
   * Not async: there is nothing to await, and pretending otherwise makes the button look
   * like it is waiting on a request that was never made.
   */
  function finish() {
    setFinishing(true)
    void navigate('/dashboard')
  }

  const progress = `${(step / TOTAL_STEPS) * 100}%`
  const busy = calculating || joining || finishing

  let nextLabel: string = t('onboarding.continue')
  if (step === 2) nextLabel = calculating ? t('onboarding.calculating') : t('onboarding.step2Next')
  else if (step === 3) nextLabel = t('onboarding.step3Next')
  else if (step === 4) nextLabel = joining ? t('onboarding.joining') : t('onboarding.continue')
  else if (step === TOTAL_STEPS)
    nextLabel = finishing ? t('onboarding.finishing') : t('onboarding.finish')

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <button
        type="button"
        onClick={toggle}
        aria-label={theme === 'dark' ? t('onboarding.themeToLight') : t('onboarding.themeToDark')}
        className="fixed right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-hair bg-surface text-muted transition hover:text-ink"
      >
        {theme === 'dark' ? (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden="true">
            <path
              d="M12 7a5 5 0 100 10 5 5 0 000-10zM12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden="true">
            <path d="M20 14.5A8 8 0 119.5 4 6.5 6.5 0 0020 14.5z" />
          </svg>
        )}
      </button>

      <div className="mx-auto flex w-full max-w-[540px] flex-1 flex-col px-6 pb-10 pt-9 sm:px-7">
        {/* topo: marca + progresso */}
        <div className="mb-6 flex items-center gap-3">
          <BrandMark size={30} />
          <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-track">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
              style={{ width: progress }}
            />
          </div>
          <span className="whitespace-nowrap text-xs font-extrabold text-muted">
            {t('onboarding.stepProgress', {
              step,
              total: TOTAL_STEPS,
              label: STEP_LABELS[step - 1],
            })}
          </span>
        </div>

        {/* One form around every step, so Enter in a field advances the way the button
            does. It submits through goNext rather than handleSubmit because only two of
            the five steps are the profile form; the other three have their own checks. */}
        <FormProvider {...form}>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void goNext()
            }}
            noValidate
            className="flex flex-1 flex-col"
          >
            <div className="flex flex-1 flex-col justify-center py-2">
              {step === 1 && (
                <StepAboutYou t={t} sexOptions={SEX_OPTIONS} goalOptions={GOAL_OPTIONS} />
              )}

              {step === 2 && (
                <Controller
                  name="activityLevel"
                  control={form.control}
                  render={({ field }) => (
                    <StepRoutine
                      t={t}
                      activityLevel={field.value ?? ''}
                      setActivityLevel={field.onChange}
                      activityOptions={ACTIVITY_OPTIONS}
                    />
                  )}
                />
              )}

              {step === 3 && tdee && <StepTargets t={t} tdee={tdee} />}

              {step === 4 && (
                <StepPartner
                  t={t}
                  inviteId={inviteId}
                  mode={mode}
                  setMode={setMode}
                  inviteCode={inviteCode}
                  setInviteCode={setInviteCode}
                />
              )}

              {step === 5 && (
                <StepBet
                  t={t}
                  betId={betId}
                  mode={mode}
                  bet={bet}
                  setBet={setBet}
                  betSuggestions={BET_SUGGESTIONS}
                />
              )}
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
                {error}
              </p>
            )}

            {/* rodapé: voltar / avançar */}
            <div className="mt-5 flex items-center gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={busy}
                  className="btn-ghost text-ink disabled:opacity-60"
                >
                  {t('onboarding.back')}
                </button>
              )}
              <button
                type="submit"
                disabled={busy}
                className="btn-primary flex-1 disabled:opacity-60"
              >
                {nextLabel}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  )
}
