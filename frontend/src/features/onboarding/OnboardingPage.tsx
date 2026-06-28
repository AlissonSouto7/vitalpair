import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { getTdee, updateProfile } from '../../api/profile'
import { joinPair } from '../../api/pair'
import { Select } from '../../components/ui/Select'
import { DateField } from '../../components/ui/DateField'
import { CalorieRing } from '../../components/ui/CalorieRing'
import { BrandMark } from '../../components/brand/BrandMark'
import { useTheme } from '../../hooks/useTheme'
import type { ActivityLevel, Goal, Sex, Tdee } from '../../types/profile'

const STEP_LABELS = ['Você', 'Rotina', 'Sua meta', 'Parceria', 'Aposta']
const TOTAL_STEPS = STEP_LABELS.length

type Mode = 'pair' | 'solo'

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Feminino' },
  { value: 'OTHER', label: 'Outro' },
]

const GOAL_OPTIONS: { value: Goal; label: string; hint: string; icon: ReactNode; tone: GoalTone }[] = [
  {
    value: 'LOSE_WEIGHT',
    label: 'Perder peso',
    hint: 'Comer um pouco menos do que gasta',
    icon: <IconDown className="h-5 w-5" />,
    tone: 'brand',
  },
  {
    value: 'GAIN_MUSCLE',
    label: 'Ganhar massa',
    hint: 'Comer um pouco mais e treinar pesado',
    icon: <IconMuscle className="h-5 w-5" />,
    tone: 'rival',
  },
  {
    value: 'MAINTAIN',
    label: 'Manter o peso',
    hint: 'Tá de boa, só quer constância',
    icon: <IconEqual className="h-5 w-5" />,
    tone: 'success',
  },
  {
    value: 'IMPROVE_FITNESS',
    label: 'Melhorar o condicionamento',
    hint: 'Mais disposição e fôlego no dia a dia',
    icon: <IconSpark className="h-5 w-5" />,
    tone: 'carb',
  },
]

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; hint: string }[] = [
  { value: 'SEDENTARY', label: 'Parado a maior parte', hint: 'Trabalho sentado, pouco movimento' },
  { value: 'LIGHT', label: 'Me mexo de leve', hint: 'Caminhadas, 1-2 treinos na semana' },
  { value: 'MODERATE', label: 'Ativo de verdade', hint: 'Treino 3-5 vezes por semana' },
  { value: 'ACTIVE', label: 'Não paro nunca', hint: 'Treino pesado quase todo dia' },
  { value: 'VERY_ACTIVE', label: 'Atleta mesmo', hint: 'Treino dobrado, rotina puxada' },
]

const BET_SUGGESTIONS = [
  'paga o jantar',
  'escolhe o filme do mês',
  'lava a louça a semana toda',
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  const [step, setStep] = useState(1)

  // passo 1
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [sex, setSex] = useState<Sex | ''>('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [goal, setGoal] = useState<Goal | ''>('')

  // passo 2
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>('')

  // passo 3 (resultado)
  const [tdee, setTdee] = useState<Tdee | null>(null)
  const [calculating, setCalculating] = useState(false)

  // passo 4
  const [mode, setMode] = useState<Mode | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)

  // passo 5
  const [bet, setBet] = useState('Quem perder paga o jantar')

  const [error, setError] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)

  function step1Valid() {
    return (
      name.trim().length > 0 &&
      birthDate.length > 0 &&
      sex !== '' &&
      Number(heightCm) > 0 &&
      Number(weightKg) > 0 &&
      goal !== ''
    )
  }

  async function goNext() {
    setError(null)

    // valida o passo atual
    if (step === 1) {
      if (!step1Valid()) {
        setError('Preenche tudo aí em cima pra gente calcular sua meta certinho.')
        return
      }
    }
    if (step === 2 && activityLevel === '') {
      setError('Escolhe como é seu dia a dia.')
      return
    }

    // ao sair do passo 2, salva o perfil e calcula a meta antes de mostrar o passo 3
    if (step === 2) {
      await saveProfileAndCalc()
      return
    }

    // passo 4: se escolheu par e digitou código, entra no par
    if (step === 4) {
      if (!mode) {
        setError('Escolhe se vai jogar com alguém ou começar solo.')
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
      finish()
    }
  }

  function goBack() {
    setError(null)
    setStep((s) => Math.max(1, s - 1))
  }

  async function saveProfileAndCalc() {
    if (sex === '' || goal === '' || activityLevel === '') return
    setCalculating(true)
    setError(null)
    try {
      await updateProfile({
        name: name.trim(),
        birthDate,
        sex,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        goal,
        activityLevel,
      })
      const result = await getTdee()
      setTdee(result)
      setStep(3)
    } catch (err) {
      setError(apiMessage(err, 'Algum dado ficou estranho. Confere a data de nascimento, o peso e a altura, e tenta de novo.'))
    } finally {
      setCalculating(false)
    }
  }

  async function tryJoinPair(): Promise<boolean> {
    setJoining(true)
    setError(null)
    try {
      await joinPair(inviteCode.trim())
      return true
    } catch (err) {
      setError(apiMessage(err, 'Esse código não colou. Confere com a pessoa e tenta de novo.'))
      return false
    } finally {
      setJoining(false)
    }
  }

  async function finish() {
    setFinishing(true)
    // TODO: backend de temporada/aposta — persistir `bet` e abrir a temporada de 30 dias.
    navigate('/dashboard')
  }

  const progress = `${(step / TOTAL_STEPS) * 100}%`
  const busy = calculating || joining || finishing

  let nextLabel = 'Continuar'
  if (step === 2) nextLabel = calculating ? 'Calculando...' : 'Tá bom pra mim'
  else if (step === 3) nextLabel = 'Bora pro placar'
  else if (step === 4) nextLabel = joining ? 'Entrando...' : 'Continuar'
  else if (step === TOTAL_STEPS) nextLabel = finishing ? 'Começando...' : 'Começar a temporada'

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <button
        type="button"
        onClick={toggle}
        aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        className="fixed right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-hair bg-surface text-muted transition hover:text-ink"
      >
        {theme === 'dark' ? (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden="true">
            <path d="M12 7a5 5 0 100 10 5 5 0 000-10zM12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
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
            {step} de {TOTAL_STEPS} · {STEP_LABELS[step - 1]}
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-center py-2">
          {step === 1 && (
            <StepWrap>
              <StepHeader
                title="Bora te conhecer"
                subtitle="Isso aqui é pra calcular sua meta certinha. Leva 30 segundos."
              />

              <div className="mb-4">
                <label className="label">Como te chamam?</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="input"
                />
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Peso</label>
                  <Unit unit="kg">
                    <input
                      type="number"
                      min={20}
                      max={500}
                      step="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="78"
                      className="input pr-10"
                    />
                  </Unit>
                </div>
                <div>
                  <label className="label">Altura</label>
                  <Unit unit="cm">
                    <input
                      type="number"
                      min={50}
                      max={300}
                      step="1"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="179"
                      className="input pr-10"
                    />
                  </Unit>
                </div>
              </div>

              <div className="mb-4">
                <label className="label">Nascimento</label>
                <DateField value={birthDate} onChange={setBirthDate} />
              </div>

              <div className="mb-5">
                <label className="label">Sexo</label>
                <Select value={sex} onChange={setSex} options={SEX_OPTIONS} placeholder="Selecione" />
              </div>

              <div>
                <label className="label">Qual seu foco agora?</label>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {GOAL_OPTIONS.map((g) => (
                    <GoalCard
                      key={g.value}
                      active={goal === g.value}
                      label={g.label}
                      hint={g.hint}
                      icon={g.icon}
                      tone={g.tone}
                      onClick={() => setGoal(g.value)}
                    />
                  ))}
                </div>
              </div>
            </StepWrap>
          )}

          {step === 2 && (
            <StepWrap>
              <StepHeader
                title="Como é seu dia a dia?"
                subtitle="Sem julgamento. Só pra acertar a conta de quanto você gasta."
              />
              <div className="flex flex-col gap-2.5">
                {ACTIVITY_OPTIONS.map((a) => (
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
          )}

          {step === 3 && tdee && (
            <StepWrap>
              <div className="text-center">
                <p className="mb-1 font-display text-2xl font-semibold text-ink">Tá pronto!</p>
                <p className="mb-5 text-sm font-semibold text-muted">
                  Com base no que você falou, sua meta por dia é
                </p>

                <div className="mb-5 flex justify-center">
                  <CalorieRing
                    current={tdee.dailyCalorieTarget}
                    goal={tdee.dailyCalorieTarget}
                    size={200}
                  />
                </div>

                <div className="mb-4 grid grid-cols-3 divide-x divide-hair overflow-hidden rounded-2xl border border-hair">
                  <MacroCell label="Proteína" grams={tdee.proteinTargetG} tone="brand" />
                  <MacroCell label="Carbo" grams={tdee.carbTargetG} tone="carb" />
                  <MacroCell label="Gordura" grams={tdee.fatTargetG} tone="success" />
                </div>

                <p className="text-sm font-semibold leading-relaxed text-muted">
                  Relaxa, não precisa decorar nada disso. O app cuida da conta, você só registra o que come.
                </p>
              </div>
            </StepWrap>
          )}

          {step === 4 && (
            <StepWrap>
              <StepHeader
                title="Vai jogar com quem?"
                subtitle="Os dois jeitos funcionam. Dá pra trocar depois, fica tranquilo."
              />
              <div className="flex flex-col gap-3">
                <ModeCard active={mode === 'pair'} onClick={() => setMode('pair')} tone="rival">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-rival-soft text-rival">
                      <IconPair className="h-[22px] w-[22px]" />
                    </span>
                    <div className="text-left">
                      <div className="text-[15px] font-extrabold text-ink">Com alguém</div>
                      <div className="text-xs font-semibold text-muted">
                        Chama a pessoa pra disputar de verdade
                      </div>
                    </div>
                  </div>
                  {mode === 'pair' && (
                    <div className="mt-3 border-t border-hair pt-3 text-left">
                      <label className="label">Já tem um código de convite?</label>
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="VITA-XXXX"
                        className="input font-display tracking-[0.12em]"
                      />
                      <p className="mt-2 text-[11.5px] font-semibold text-muted">
                        Tem o código que a pessoa te mandou? Cola aí. Se ainda não tem, segue sem ele que a
                        gente te dá um pra mandar pra ela.
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
                      <div className="text-[15px] font-extrabold text-ink">Só eu por enquanto</div>
                      <div className="text-xs font-semibold text-muted">
                        Compete contra você mesmo da semana passada
                      </div>
                    </div>
                  </div>
                  {mode === 'solo' && (
                    <div className="mt-3 border-t border-hair pt-3 text-left text-[11.5px] font-semibold text-muted">
                      Fechou. Você começa sozinho e pode chamar alguém quando bater vontade.
                    </div>
                  )}
                </ModeCard>
              </div>
            </StepWrap>
          )}

          {step === 5 && (
            <StepWrap>
              <StepHeader
                title={mode === 'solo' ? 'O que você ganha se vencer?' : 'Bora apostar?'}
                subtitle={
                  mode === 'solo'
                    ? 'Combine consigo mesmo: bateu a meta da semana, ganha o quê?'
                    : 'Combina com a pessoa o que tá em jogo. Nada pesado, a graça é provocar.'
                }
              />

              <label className="label">O que tá em jogo</label>
              <input
                type="text"
                value={bet}
                onChange={(e) => setBet(e.target.value)}
                className="input mb-3.5 border-brand focus:border-brand"
              />

              <div className="mb-6 flex flex-wrap gap-2">
                {BET_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setBet(`Quem perder ${s}`)}
                    className="rounded-full border border-hair bg-surface px-3 py-2 text-xs font-bold text-ink transition hover:border-brand/60"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-hair bg-surface px-4 py-4">
                <span className="font-display text-[13px] font-semibold text-muted">30 dias</span>
                <span className="h-px flex-1 bg-hair" />
                <span className="font-display text-[13px] font-semibold text-ink">vale tudo (de leve)</span>
              </div>

              {/* TODO: backend de temporada/aposta — a aposta acima é só visual por enquanto. */}
            </StepWrap>
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
              Voltar
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={busy}
            className="btn-primary flex-1 disabled:opacity-60"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- subcomponentes ---------- */

function StepWrap({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-[27px] font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-1.5 text-sm font-semibold text-muted">{subtitle}</p>
    </div>
  )
}

type GoalTone = 'brand' | 'rival' | 'success' | 'carb'

const GOAL_TONE_CLS: Record<GoalTone, { soft: string; fg: string }> = {
  brand: { soft: 'bg-brand-soft', fg: 'text-brand' },
  rival: { soft: 'bg-rival-soft', fg: 'text-rival' },
  success: { soft: 'bg-success-soft', fg: 'text-success' },
  carb: { soft: 'bg-carb/15', fg: 'text-carb-ink' },
}

function GoalCard({
  active,
  label,
  hint,
  icon,
  tone,
  onClick,
}: {
  active: boolean
  label: string
  hint: string
  icon: ReactNode
  tone: GoalTone
  onClick: () => void
}) {
  const toneCls = GOAL_TONE_CLS[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
        active ? 'border-brand bg-brand-soft' : 'border-hair bg-surface hover:border-brand/50'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneCls.soft} ${toneCls.fg}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-ink">{label}</span>
        <span className="block truncate text-xs font-semibold text-muted">{hint}</span>
      </span>
    </button>
  )
}

function ActivityRow({
  active,
  label,
  hint,
  onClick,
}: {
  active: boolean
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${
        active ? 'border-brand bg-brand-soft' : 'border-hair bg-surface hover:border-brand/50'
      }`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-ink">{label}</span>
        <span className="block text-xs font-semibold text-muted">{hint}</span>
      </span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          active ? 'bg-brand' : 'border-2 border-track'
        }`}
      >
        {active && <span className="h-1.5 w-1.5 rounded-full bg-surface" />}
      </span>
    </button>
  )
}

function ModeCard({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean
  onClick: () => void
  tone: 'brand' | 'rival'
  children: ReactNode
}) {
  const activeBorder = tone === 'rival' ? 'border-rival bg-rival-soft' : 'border-brand bg-brand-soft'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`block w-full rounded-2xl border p-4 text-left transition ${
        active ? activeBorder : 'border-hair bg-surface hover:border-brand/50'
      }`}
    >
      {children}
    </button>
  )
}

function MacroCell({
  label,
  grams,
  tone,
}: {
  label: string
  grams: number
  tone: 'brand' | 'carb' | 'success'
}) {
  const color =
    tone === 'brand' ? 'text-brand-ink' : tone === 'carb' ? 'text-carb-ink' : 'text-success-ink'
  return (
    <div className="bg-surface px-3 py-4 text-center">
      <div className={`font-display text-xl font-semibold ${color}`}>{Math.round(grams)}g</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted">{label}</div>
    </div>
  )
}

function Unit({ unit, children }: { unit: string; children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-faint">
        {unit}
      </span>
    </div>
  )
}

function apiMessage(err: unknown, fallback: string) {
  const message = err instanceof AxiosError ? err.response?.data?.message : null
  // "Erro de validação" é genérico do backend; mostramos o fallback amigável no lugar.
  if (message && message !== 'Erro de validação') return message
  return fallback
}

/* ---------- ícones SVG preenchidos ---------- */

function IconDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M11 4h2v9.2l3.3-3.3 1.4 1.4L12 17 6.3 11.3l1.4-1.4L11 13.2z" />
    </svg>
  )
}

function IconMuscle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3 11h2V9a1.5 1.5 0 013 0v6a1.5 1.5 0 01-3 0v-1H3zm18 0h-2V9a1.5 1.5 0 00-3 0v6a1.5 1.5 0 003 0v-1h2zM7.5 11h9v2h-9z" />
    </svg>
  )
}

function IconEqual({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M4 8h16v2.4H4zm0 5.6h16V16H4z" />
    </svg>
  )
}

function IconSpark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
    </svg>
  )
}

function IconPair({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 7a3 3 0 116 0 3 3 0 01-6 0zm9 1.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5zM3 19c0-3 2.7-5 8-5s8 2 8 5v1H3z" />
    </svg>
  )
}

function IconSolo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z" />
    </svg>
  )
}
