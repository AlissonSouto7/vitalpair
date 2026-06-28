import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { FoodLog } from '../../types/nutrition'

function formatTime(iso: string, locale: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}

interface MacroTone {
  bar: string
  dot: string
}

const TONES: Record<'brand' | 'carb' | 'success', MacroTone> = {
  brand: { bar: 'bg-brand', dot: 'bg-brand' },
  carb: { bar: 'bg-carb', dot: 'bg-carb' },
  success: { bar: 'bg-success', dot: 'bg-success' },
}

interface MealDetailModalProps {
  meal: FoodLog
  onClose: () => void
  onDelete?: (id: string) => void
}

export function MealDetailModal({ meal, onClose, onDelete }: MealDetailModalProps) {
  const { t, i18n } = useTranslation()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // gramas por macro (4/4/9 kcal por grama) pra montar a barra proporcional ao total calórico
  const pCal = meal.proteinG * 4
  const cCal = meal.carbG * 4
  const fCal = meal.fatG * 9
  const macroCal = pCal + cCal + fCal
  const pct = (kcal: number) => (macroCal > 0 ? Math.round((kcal / macroCal) * 100) : 0)

  const macros: { label: string; grams: number; pct: number; tone: keyof typeof TONES }[] = [
    { label: t('nutrition.proteinShort'), grams: meal.proteinG, pct: pct(pCal), tone: 'brand' },
    { label: t('nutrition.carbShort'), grams: meal.carbG, pct: pct(cCal), tone: 'carb' },
    { label: t('nutrition.fatShort'), grams: meal.fatG, pct: pct(fCal), tone: 'success' },
  ]

  const time = formatTime(meal.loggedAt, i18n.language)
  const sourceLabel = meal.source === 'OPEN_FOOD_FACTS' ? t('nutrition.sourceOFF') : t('nutrition.sourceManual')

  // anel de calorias: arco proporcional aos macros que de fato bateram (sempre cheio aqui)
  const RADIUS = 50
  const CIRC = 2 * Math.PI * RADIUS

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('nutrition.modalAria', { name: meal.foodName })}
      className="fixed inset-0 z-50 flex justify-end bg-[rgba(40,28,16,0.45)] backdrop-blur-[2px] dark:bg-[rgba(0,0,0,0.6)]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="h-full w-[420px] max-w-full overflow-y-auto bg-canvas px-6 py-6 shadow-[-20px_0_50px_rgba(0,0,0,0.2)]">
        {/* Cabeçalho */}
        <div className="mb-5 flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-brand-ink">
            {t(`nutrition.mealShort.${meal.mealType}`)}
            {time ? ` · ${time}` : ''}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t('nutrition.close')}
            className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-surface text-muted transition hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z" />
            </svg>
          </button>
        </div>

        {/* Faixa ilustrativa */}
        <div className="mb-5 flex h-32 w-full items-center justify-center rounded-[18px] bg-gradient-to-br from-brand-soft to-brand/20">
          <svg viewBox="0 0 24 24" className="h-12 w-12 text-brand" fill="currentColor" aria-hidden="true">
            <path d="M7 2v7a3 3 0 0 0 2 2.83V22h2V11.83A3 3 0 0 0 13 9V2h-2v6H9.5V2h-1.5v6H7zM17 2c-1.7 0-3 2.2-3 5 0 2.4 1 4.3 2 4.8V22h2V2z" />
          </svg>
        </div>

        {/* Título */}
        <h1 className="mb-1 font-display text-[22px] font-semibold tracking-tight text-ink">
          {meal.foodName}
        </h1>
        <div className="mb-5 text-[13px] font-bold text-muted">{t('nutrition.onPlate', { grams: meal.quantityG })}</div>

        {/* Anel + breakdown */}
        <div className="mb-4 flex items-center gap-[18px] rounded-2xl border border-hair bg-surface p-[18px]">
          <div className="relative h-[88px] w-[88px] shrink-0">
            <svg width="88" height="88" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={RADIUS} fill="none" className="stroke-track" strokeWidth="13" />
              <circle
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                className="stroke-success"
                strokeWidth="13"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * 0.12}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display text-xl font-semibold leading-none text-ink">
                {Math.round(meal.caloriesKcal)}
              </div>
              <div className="text-[9px] font-extrabold text-muted">kcal</div>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-[11px]">
            {macros.map((m) => (
              <div key={m.label}>
                <div className="mb-1 flex items-center justify-between text-xs font-extrabold text-ink">
                  <span>{m.label}</span>
                  <span className="text-muted">
                    {Math.round(m.grams)}g · {m.pct}%
                  </span>
                </div>
                <div className="h-[7px] overflow-hidden rounded-[5px] bg-track">
                  <div className={`h-full rounded-[5px] ${TONES[m.tone].bar}`} style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ficha: porção, horário, origem */}
        <div className="mb-1 mt-[18px] text-[11px] font-extrabold uppercase tracking-[0.06em] text-muted">
          {t('nutrition.details')}
        </div>
        <div className="flex flex-col gap-2">
          <InfoRow
            label={t('nutrition.portion')}
            value={`${meal.quantityG}g`}
            icon={
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4 5 9H7z" />
            }
          />
          {time && (
            <InfoRow
              label={t('nutrition.time')}
              value={time}
              icon={<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5h-2v6l5 3 1-1.7-4-2.3z" />}
            />
          )}
          <InfoRow
            label={t('nutrition.origin')}
            value={sourceLabel}
            icon={
              <path d="M12 2 4 6v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6zm-1 13-4-4 1.4-1.4L11 12.2l4.6-4.6L17 9z" />
            }
          />
        </div>

        {/* Remover */}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(meal.id)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-danger-soft bg-transparent px-4 py-3 text-sm font-extrabold text-danger transition hover:bg-danger-soft"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M9 3h6l1 2h4v2H4V5h4zM6 9h12l-1 12H7zm3 2v8h2v-8zm4 0v8h2v-8z" />
            </svg>
            {t('nutrition.removeFromPlate')}
          </button>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-hair bg-surface px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-track text-muted">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
          {icon}
        </svg>
      </span>
      <span className="text-[13px] font-bold text-muted">{label}</span>
      <span className="ml-auto text-[13.5px] font-extrabold text-ink">{value}</span>
    </div>
  )
}
