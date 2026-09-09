import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { IconPlus, IconSpark } from './icons'

import { logActivity } from '@/api/activity'
import { Points } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { getApiErrorMessage } from '@/shared/api/errors'
import { Field } from '@/shared/ui/form/Field'
import { FormError } from '@/shared/ui/form/FormError'
import { NumberField } from '@/shared/ui/form/NumberField'
import type { ActivitySource, ActivityType } from '@/types/activity'

/**
 * The two forms that log activity: a workout, or a step count.
 *
 * Moved out of ActivityPage verbatim, markup untouched, along with the constants and
 * schemas only they use. Each owns its own form state and tells the page it saved through
 * onLogged, which is the whole contract between them.
 */

const WORKOUT_TYPES = [
  'RUN',
  'WALK',
  'CYCLE',
  'WORKOUT',
  'OTHER',
] as const satisfies readonly ActivityType[]

const SOURCE_VALUES = [
  'MANUAL',
  'WEWARD',
  'GOOGLE_FIT',
  'STRAVA',
  'GARMIN',
  'APPLE_HEALTH',
] as const satisfies readonly ActivitySource[]

/** A measure the person may leave blank. Blank arrives as '' and must not become 0. */
const optionalMeasure = { setValueAs: (v: string) => (v === '' ? undefined : Number(v)) }

/**
 * Mirrors LogActivityRequest, plus one rule the server does not have: at least one
 * measure. Without it an empty form logged an activity worth nothing, which still showed
 * in the day's list as if something had happened. The resolver has no home for an error
 * that belongs to the form as a whole, so that message travels as a key on the first
 * measure field and the render tells the two apart.
 */
const workoutSchema = z
  .object({
    activityType: z.enum(WORKOUT_TYPES),
    distanceKm: z.number().nonnegative().optional(),
    durationMinutes: z.number().nonnegative().optional(),
    caloriesBurned: z.number().nonnegative().optional(),
    source: z.enum(SOURCE_VALUES),
  })
  .refine((v) => v.distanceKm != null || v.durationMinutes != null || v.caloriesBurned != null, {
    path: ['distanceKm'],
    message: 'noMeasure',
  })

type WorkoutValues = z.infer<typeof workoutSchema>

const stepsSchema = z.object({
  steps: z.number().int().positive(),
})

type StepsValues = z.infer<typeof stepsSchema>

// ~0.04 kcal por passo: estimativa rapidinha pro feedback verde
const stepsToKcal = (steps: number) => Math.round(steps * 0.04)

export function WorkoutForm({ onLogged }: { onLogged: () => Promise<void> }) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const typeOptions = useMemo(
    () => WORKOUT_TYPES.map((v) => ({ value: v, label: t(`activity.typeLabel.${v}`) })),
    [t],
  )
  const sourceOptions = useMemo(
    () => SOURCE_VALUES.map((v) => ({ value: v, label: t(`activity.sourceLabel.${v}`) })),
    [t],
  )

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkoutValues>({
    resolver: zodResolver(workoutSchema),
    mode: 'onTouched',
    defaultValues: { activityType: 'RUN', source: 'MANUAL' },
  })

  async function onSubmit(values: WorkoutValues) {
    setError(null)
    try {
      await logActivity(values)
      // The type and source stay for the next entry; only the measures clear.
      reset({ activityType: values.activityType, source: values.source })
      await onLogged()
    } catch (err) {
      setError(getApiErrorMessage(err, t('activity.saveError')))
    }
  }

  const distanceError =
    errors.distanceKm &&
    t(errors.distanceKm.message === 'noMeasure' ? 'activity.noMeasure' : 'activity.negativeMeasure')

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
      className="card space-y-4"
    >
      <Field label={t('activity.type')}>
        {(field) => (
          <Controller
            name="activityType"
            control={control}
            render={({ field: f }) => (
              <Select {...field} value={f.value} onChange={f.onChange} options={typeOptions} />
            )}
          />
        )}
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <NumberField
          label={t('activity.distance')}
          error={distanceError}
          {...register('distanceKm', optionalMeasure)}
        />
        <NumberField
          label={t('activity.duration')}
          step="1"
          error={errors.durationMinutes && t('activity.negativeMeasure')}
          {...register('durationMinutes', optionalMeasure)}
        />
        <NumberField
          label={t('activity.calories')}
          step="1"
          error={errors.caloriesBurned && t('activity.negativeMeasure')}
          {...register('caloriesBurned', optionalMeasure)}
        />
      </div>
      <Field label={t('activity.source')}>
        {(field) => (
          <Controller
            name="source"
            control={control}
            render={({ field: f }) => (
              <Select {...field} value={f.value} onChange={f.onChange} options={sourceOptions} />
            )}
          />
        )}
      </Field>
      <p className="flex items-start gap-2 text-xs font-semibold text-faint">
        <IconSpark className="mt-0.5 shrink-0 text-brand" />
        {t('activity.autoEstimate')}
      </p>
      <FormError message={error} />
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary flex w-full items-center justify-center gap-2"
      >
        <IconPlus />
        {isSubmitting ? t('common.saving') : t('activity.registerWorkout')}
        {!isSubmitting && <Points value={15} />}
      </button>
    </form>
  )
}

/* ---------- formulário de passos ---------- */

export function StepsForm({ onLogged }: { onLogged: () => Promise<void> }) {
  const { t, i18n } = useTranslation()
  const questionId = useId()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StepsValues>({
    resolver: zodResolver(stepsSchema),
    mode: 'onTouched',
  })

  // useWatch rather than watch: the latter reads through a closure the React Compiler
  // cannot see into, so it skips compiling the component and says so on every lint run.
  const typed = useWatch({ control, name: 'steps' })
  const stepsNum = Number.isFinite(typed) && typed > 0 ? typed : 0

  function add(increment: number) {
    const current = getValues('steps')
    setValue('steps', (Number.isFinite(current) ? current : 0) + increment, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  async function onSubmit(values: StepsValues) {
    setError(null)
    try {
      await logActivity({ activityType: 'STEPS', steps: values.steps, source: 'MANUAL' })
      reset()
      await onLogged()
    } catch (err) {
      setError(getApiErrorMessage(err, t('activity.saveError')))
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate className="space-y-3">
      <div className="card text-center">
        <p id={questionId} className="mb-2 text-xs font-bold text-muted">
          {t('activity.stepsQuestion')}
        </p>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="0"
          aria-labelledby={questionId}
          aria-invalid={errors.steps ? true : undefined}
          className="w-full bg-transparent text-center font-display text-[44px] font-semibold leading-none text-ink outline-none placeholder:text-faint"
          {...register('steps', { valueAsNumber: true })}
        />
        {errors.steps ? (
          <p role="alert" className="mt-2 text-[13px] font-semibold text-danger">
            {t('activity.stepsInvalid')}
          </p>
        ) : (
          <p className="mt-2 text-[13px] font-extrabold text-success-ink">
            {stepsNum > 0
              ? t('activity.stepsBurn', {
                  kcal: stepsToKcal(stepsNum).toLocaleString(i18n.language),
                })
              : t('activity.stepsPrompt')}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {[1000, 5000, 10000].map((inc) => (
          <button
            key={inc}
            type="button"
            onClick={() => add(inc)}
            className="flex-1 rounded-xl border border-hair bg-surface py-2.5 text-sm font-extrabold text-ink transition hover:border-brand hover:text-brand-ink"
          >
            +{inc.toLocaleString(i18n.language)}
          </button>
        ))}
      </div>

      <p className="text-center text-xs font-semibold text-muted">{t('activity.stepsWeward')}</p>

      <FormError message={error} />

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary flex w-full items-center justify-center gap-2"
      >
        <IconPlus />
        {isSubmitting ? t('common.saving') : t('activity.registerSteps')}
        {!isSubmitting && <Points value={15} />}
      </button>
    </form>
  )
}
