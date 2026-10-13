import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useId } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { joinPair } from '../../api/pair'
import { getTdee, updateProfile } from '../../api/profile'
import { BrandMark } from '../../components/brand/BrandMark'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import type { Tdee } from '../../types/profile'
import { profileQueries } from '../profile/queries'

import {
  ABOUT_YOU_FIELDS,
  onboardingSchema,
  targetWeightProblem,
  type OnboardingValues,
} from './onboardingForm'
import { buildActivityOptions, buildGoalOptions, buildSexOptions, buildStepLabels } from './options'
import { StepAboutYou } from './StepAboutYou'
import { StepBet, StepPartner, StepRoutine, StepTargets } from './Steps'

import { getApiErrorMessage } from '@/shared/api/errors'

const TOTAL_STEPS = 5

type Mode = 'pair' | 'solo'

export function OnboardingPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const inviteId = useId()
  const betId = useId()
  const navigate = useNavigate()

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
  /*
   * O nome já foi dito no cadastro, então ele vem preenchido.
   *
   * Pedir "Como te chamam?" outra vez, dez segundos depois de a pessoa ter digitado o nome
   * para criar a conta, é a primeira coisa que o app faz. O servidor já sabe a resposta:
   * `POST /auth/register` grava o nome, e esta é a mesma query que o resto do app lê.
   *
   * `values` e não `defaultValues`: a query resolve depois do primeiro render, e
   * `defaultValues` só é lido uma vez, então o campo continuaria vazio. `values` reaplica
   * quando o dado chega, e o que a pessoa digitar por cima continua valendo, porque só muda
   * quando a própria origem muda.
   */
  const profileQuery = useQuery(profileQueries.profile())
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onTouched',
    defaultValues: { name: '', birthDate: '' },
  })

  /*
   * A query resolve depois do primeiro render, então o valor entra aqui e não em
   * `defaultValues`, que só é lido uma vez. `shouldDirty: false` para o campo não contar
   * como "mexido pela pessoa", e a checagem de `isDirty` para nunca escrever por cima do
   * que ela estiver digitando se a resposta chegar atrasada.
   */
  const nomeDoPerfil = profileQuery.data?.name
  useEffect(() => {
    if (!nomeDoPerfil) return
    if (form.getFieldState('name').isDirty) return
    form.setValue('name', nomeDoPerfil, { shouldDirty: false })
  }, [nomeDoPerfil, form])
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

    /*
     * Os campos deste passo, e as regras que cruzam dois deles.
     *
     * `trigger` com uma lista de campos checa cada um contra a própria regra e não executa o
     * `superRefine` do esquema, que é uma regra de objeto: medido, um alvo de 90 kg para quem
     * pesa 78 e quer emagrecer passava pelo passo 1 sem aviso e só era recusado pelo servidor,
     * duas telas depois. Aqui o objeto inteiro é validado e só os erros deste passo importam,
     * porque a rotina ainda não está na tela para ser respondida.
     */
    if (step === 1) {
      await form.trigger(ABOUT_YOU_FIELDS)
      const doPasso = ABOUT_YOU_FIELDS.some((campo) => form.getFieldState(campo).error)
      // Pela função, e não pelo esquema inteiro: o zod só executa refinamentos de objeto
      // depois que todos os campos passam, e a rotina ainda não foi respondida aqui.
      const contradiz = targetWeightProblem(form.getValues())
      if (contradiz) {
        form.setError('targetWeightKg', { type: 'custom', message: contradiz })
      }
      if (doPasso || contradiz) {
        setError(t('onboarding.errorStep1'))
        return
      }
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
      /*
        O perfil é lido do cache em outros lugares, e esta chamada escreve nele por fora.
        Sem avisar, o roteador continua vendo o perfil vazio que leu na entrada e manda a
        pessoa de volta para cá no fim do onboarding, em loop.
      */
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
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
          {/*
            O botão de tema é um item desta linha, e não um elemento flutuante.

            Como `fixed right-4 top-4` ele passava por cima do "1 de 5 · Você": medido num
            iPhone de 390px, o botão ocupava x 328-364 e o texto x 284-356, ou seja 28px de
            sobreposição, e o passo em que a pessoa estava ficava ilegível.
          */}
          {/* O componente, e não uma segunda cópia: ver a nota no AuthShell. */}
          <ThemeToggle />
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

            {/*
              `role="alert"`: sem ele, esta mensagem aparecia em silêncio.

              Medido no passo da parceria com um código errado: o servidor responde 404, a
              tela escreve "Convite inválido" e o formulário não avança. Para quem vê, o
              vermelho explica; para quem usa leitor de tela, o botão simplesmente não fez
              nada. É o único aviso de erro do onboarding inteiro, então cobre também a falha
              ao calcular a meta e o campo que faltou.
            */}
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger"
              >
                {error}
              </p>
            )}

            {/*
              Rodapé fixo, e não no fim do conteúdo.

              Medido num iPhone 390x844 com o passo 1 inteiro preenchido: o "Continuar"
              caía em y=867, ou seja 23px abaixo da borda da tela, sem nada indicando que
              existisse. A pessoa preenchia tudo e travava, achando que a validação tinha
              recusado. Eu mesmo só consegui avançar depois de rolar até ele.

              `pb-[env(safe-area-inset-bottom)]` porque no iPhone a faixa do gesto de home
              fica por cima de qualquer coisa colada no fim da tela.
            */}
            <div className="sticky bottom-0 z-10 -mx-6 mt-5 flex items-center gap-3 border-t border-hair bg-canvas px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:-mx-7 sm:px-7">
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
