import type { TFunction } from 'i18next'
import { useState } from 'react'

import type { Draft } from './draft'
import { Dot } from './parts'
import { portionLabel, portionsFor } from './portions'

import { NumberField } from '@/shared/ui/form/NumberField'
import type { MealType } from '@/types/nutrition'

/**
 * Registrar uma refeição, uma pergunta por vez.
 *
 * Eram cinco campos numéricos por 100g (kcal, proteína, carbo, gordura, gramas) numa grade
 * de duas colunas, tudo junto com a escolha da refeição, a privacidade e dois botões de
 * salvar. No primeiro teste com usuária real a tela foi descrita como "extremamente
 * horrível" e "confuso": quem queria dizer "comi um pão" recebia uma planilha.
 *
 * Agora são duas perguntas, cada uma cabendo inteira num celular sem rolar: em qual
 * refeição, e quanto. As porções ("1 pão", "2 pães") substituem o campo de gramas como
 * caminho principal.
 *
 * O ajuste manual continua existindo, aberto por um toque em qualquer um dos dois passos.
 * Não é um detalhe: esconder os números do catálogo deixaria sem saída quem sabe exatamente
 * o que comeu, e o ponto da mudança é dar um caminho rápido a quem não sabe, não tirar o
 * caminho exato de quem sabe.
 */
export function MealEditor({
  t,
  draft,
  setDraft,
  computed,
  foodNameId,
  mealLabel,
  mealValues,
  onSave,
  onDiscard,
  saving,
}: {
  t: TFunction
  draft: Draft
  setDraft: (next: Draft) => void
  computed: { calories: number; protein: number; carb: number; fat: number }
  foodNameId: string
  mealLabel: (meal: MealType) => string
  mealValues: MealType[]
  onSave: () => void
  onDiscard: () => void
  saving: boolean
}) {
  /*
   * Um item vindo da busca já tem nome e números, então a primeira pergunta é a refeição.
   * Um item digitado à mão não tem nada, e perguntar "quanto?" antes de saber o que é seria
   * absurdo: esse começa no passo do nome, com o ajuste já aberto.
   */
  const manual = draft.source === 'MANUAL' && !draft.name.trim()
  const [step, setStep] = useState<'meal' | 'amount'>(manual ? 'amount' : 'meal')
  const [tweaking, setTweaking] = useState(manual)

  const portions = portionsFor(draft.name)
  const gramsNow = draft.grams.trim()

  /**
   * Por que a refeição não pode ser saltada.
   *
   * O café da manhã vem pré-escolhido pela hora do dia, então este passo é quase sempre uma
   * confirmação de um toque. Ele existe porque a alternativa, que é adivinhar em silêncio,
   * foi o que fazia a pessoa registrar o almoço dentro do café sem perceber.
   */
  const total = manual ? 1 : 2
  const current = step === 'meal' ? 1 : total

  return (
    <section className="card border-act/40">
      {/* Passo N de M, com os traços que dizem quanto falta. */}
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex gap-1.5" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-1 w-6 rounded-full ${i < current ? 'bg-act' : 'bg-track'}`}
            />
          ))}
        </div>
        <span className="text-[11px] font-extrabold tracking-wide text-muted">
          {t('nutrition.stepOf', { current, total })}
        </span>
      </div>

      {step === 'meal' && (
        <>
          <h2 className="font-display text-xl font-semibold text-ink">
            {t('nutrition.whichMealQuestion')}
          </h2>
          <p className="mb-4 mt-0.5 text-[13px] font-bold text-muted">{draft.name}</p>

          <div className="grid gap-2">
            {mealValues.map((value) => {
              const active = draft.mealType === value
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setDraft({ ...draft, mealType: value })
                    setStep('amount')
                  }}
                  className={`flex min-h-[52px] items-center justify-between rounded-xl border px-4 py-3 text-left text-[15px] font-extrabold transition ${
                    active
                      ? 'border-act bg-act-soft text-act-ink'
                      : 'border-hair bg-surface text-ink hover:border-act/50'
                  }`}
                >
                  {mealLabel(value)}
                </button>
              )
            })}
          </div>
        </>
      )}

      {step === 'amount' && (
        <>
          <h2 className="font-display text-xl font-semibold text-ink">
            {manual ? t('nutrition.editorTitleManual') : t('nutrition.howMuchQuestion')}
          </h2>
          {!manual && (
            <p className="mb-4 mt-0.5 text-[13px] font-bold text-muted">
              {draft.name} · {mealLabel(draft.mealType)}
            </p>
          )}

          {manual && (
            <div className="mb-4 mt-3">
              <label htmlFor={foodNameId} className="label">
                {t('nutrition.whatLabel')}
              </label>
              <input
                id={foodNameId}
                type="text"
                placeholder={t('nutrition.foodNamePlaceholder')}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="input"
              />
            </div>
          )}

          {!manual && (
            <div className="grid gap-2">
              {portions.map((p) => {
                const active = gramsNow === String(p.grams)
                return (
                  <button
                    key={p.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setDraft({ ...draft, grams: String(p.grams) })}
                    className={`flex min-h-[52px] items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-[15px] font-extrabold transition ${
                      active
                        ? 'border-act bg-act-soft text-act-ink'
                        : 'border-hair bg-surface text-ink hover:border-act/50'
                    }`}
                  >
                    {portionLabel(t, p.key)}
                    <span
                      className={`text-[12.5px] font-bold tabular-nums ${active ? 'text-act-ink' : 'text-muted'}`}
                    >
                      {p.grams} g
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* O total, que muda junto com a porção escolhida. */}
          <div className="mt-4 rounded-xl border border-hair bg-canvas px-4 py-3">
            <div className="font-display text-2xl font-semibold tabular-nums text-ink">
              {computed.calories} kcal
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] font-bold text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Dot tone="protein" /> P {computed.protein}g
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Dot tone="carb" /> C {computed.carb}g
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Dot tone="fat" /> G {computed.fat}g
              </span>
            </div>
          </div>

          {/*
            O caminho exato, para quem sabe o que comeu.

            Fica fechado por padrão porque é a exceção, e aberto de saída no registro à mão,
            onde é o único caminho. Um <details> e não um modal: abrir empurra o conteúdo
            para baixo, sem tirar a pessoa de onde ela está.
          */}
          <details
            className="mt-3"
            open={tweaking}
            onToggle={(e) => setTweaking(e.currentTarget.open)}
          >
            <summary className="flex min-h-[38px] cursor-pointer list-none items-center gap-1.5 py-2 text-[13px] font-extrabold text-you-ink [&::-webkit-details-marker]:hidden">
              {t('nutrition.tweakNumbers')}
              <span aria-hidden="true">{tweaking ? '▴' : '▾'}</span>
            </summary>

            <div className="mt-2 grid grid-cols-2 gap-3">
              <NumberField
                label={t('nutrition.kcalField')}
                value={draft.kcalPer100}
                onChange={(e) => setDraft({ ...draft, kcalPer100: e.target.value })}
                error={draft.kcalPer100.trim() === '' ? t('nutrition.kcalRequired') : undefined}
              />
              <NumberField
                label={t('nutrition.gramsField')}
                value={draft.grams}
                onChange={(e) => setDraft({ ...draft, grams: e.target.value })}
              />
              <NumberField
                label={t('nutrition.protField')}
                value={draft.proteinPer100}
                onChange={(e) => setDraft({ ...draft, proteinPer100: e.target.value })}
              />
              <NumberField
                label={t('nutrition.carbField')}
                value={draft.carbPer100}
                onChange={(e) => setDraft({ ...draft, carbPer100: e.target.value })}
              />
              <NumberField
                label={t('nutrition.fatField')}
                value={draft.fatPer100}
                onChange={(e) => setDraft({ ...draft, fatPer100: e.target.value })}
              />
            </div>

            {manual && (
              <div className="mt-3 flex flex-wrap gap-2">
                {mealValues.map((value) => {
                  const active = draft.mealType === value
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setDraft({ ...draft, mealType: value })}
                      className={`rounded-lg px-3 py-2 text-xs font-extrabold transition ${
                        active ? 'bg-act-soft text-act-ink' : 'bg-track text-muted hover:text-ink'
                      }`}
                    >
                      {mealLabel(value)}
                    </button>
                  )
                })}
              </div>
            )}
          </details>

          <label className="mt-3 flex items-center gap-2 text-sm font-bold text-muted">
            <input
              type="checkbox"
              checked={draft.isPrivate}
              onChange={(e) => setDraft({ ...draft, isPrivate: e.target.checked })}
              className="h-4 w-4 accent-act"
            />
            {t('nutrition.onlyMe')}
          </label>
        </>
      )}

      {/*
        Rodapé colado embaixo, dentro do cartão.

        O botão de salvar vivia no fim de um formulário alto e, num iPhone, caía fora da
        tela: a pessoa escolhia tudo e não via como confirmar. Aqui ele acompanha o passo.
      */}
      <div className="sticky bottom-0 -mx-5 mt-5 flex items-center gap-2 border-t border-hair bg-surface px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={step === 'amount' && !manual ? () => setStep('meal') : onDiscard}
          className="btn-ghost shrink-0"
        >
          {step === 'amount' && !manual ? t('common.back') : t('nutrition.discard')}
        </button>

        {step === 'amount' && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !draft.name.trim() || draft.kcalPer100.trim() === ''}
            className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? t('common.saving')
              : t('nutrition.registerIn', { meal: mealLabel(draft.mealType) })}
          </button>
        )}
      </div>
    </section>
  )
}
