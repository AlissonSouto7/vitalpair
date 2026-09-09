import type { TFunction } from 'i18next'

import type { Draft } from './draft'
import { Dot } from './parts'

import { NumberField } from '@/shared/ui/form/NumberField'
import type { MealType } from '@/types/nutrition'

/**
 * The editor that opens once a food is chosen: check the portion, adjust, save.
 *
 * Lifted out of NutritionPage verbatim, markup untouched. The draft stays in the page
 * because the save button lives in a fixed bar outside this section and reads the same
 * value; owning it here would mean lifting it straight back up.
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
  return (
    <section className="card border-brand/40">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-brand" />
        <h2 className="text-sm font-extrabold text-brand-ink">
          {draft.source === 'MANUAL'
            ? t('nutrition.editorTitleManual')
            : t('nutrition.editorTitlePortion')}
        </h2>
      </div>

      <div className="space-y-4">
        <div>
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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <NumberField
            label={t('nutrition.kcalField')}
            value={draft.kcalPer100}
            onChange={(e) => setDraft({ ...draft, kcalPer100: e.target.value })}
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
          <NumberField
            label={t('nutrition.gramsField')}
            value={draft.grams}
            onChange={(e) => setDraft({ ...draft, grams: e.target.value })}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mealValues.map((value) => {
            const active = draft.mealType === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setDraft({ ...draft, mealType: value })}
                className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${
                  active ? 'bg-brand-soft text-brand-ink' : 'bg-track text-muted hover:text-ink'
                }`}
              >
                {mealLabel(value)}
              </button>
            )
          })}
          <label className="ml-auto flex items-center gap-2 text-sm font-bold text-muted">
            <input
              type="checkbox"
              checked={draft.isPrivate}
              onChange={(e) => setDraft({ ...draft, isPrivate: e.target.checked })}
              className="h-4 w-4 accent-brand"
            />
            {t('nutrition.onlyMe')}
          </label>
        </div>

        {/* Resumo macros do item */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl bg-canvas px-4 py-3 text-sm font-bold">
          <span className="font-display text-lg font-semibold text-ink">
            {computed.calories} kcal
          </span>
          <Dot tone="brand" />
          <span className="text-muted">P {computed.protein}g</span>
          <Dot tone="carb" />
          <span className="text-muted">C {computed.carb}g</span>
          <Dot tone="success" />
          <span className="text-muted">G {computed.fat}g</span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !draft.name}
            className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? t('common.saving') : t('common.add')}
          </button>
          <button type="button" onClick={onDiscard} className="btn-ghost">
            {t('nutrition.discard')}
          </button>
        </div>
      </div>
    </section>
  )
}
