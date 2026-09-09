import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import {
  activityLabel,
  editSchema,
  LEVEL_VALUES,
  SEX_VALUES,
  sexLabel,
  type EditValues,
  type TFn,
} from './profileForm'
import { TimeZoneField } from './TimeZoneField'

import { updateProfile } from '@/api/profile'
import { DateField } from '@/components/ui/DateField'
import { Select } from '@/components/ui/Select'
import { getApiErrorMessage } from '@/shared/api/errors'
import { Field } from '@/shared/ui/form/Field'
import { FormError } from '@/shared/ui/form/FormError'
import { NumberField } from '@/shared/ui/form/NumberField'
import { TextField } from '@/shared/ui/form/TextField'
import type { Goal, UserProfile } from '@/types/profile'

/**
 * The collapsed form that edits the profile.
 *
 * Moved out of ProfilePage verbatim, markup untouched. It owns only the form state, which
 * nothing outside it reads: the page hears about a save through onSaved and refetches.
 */
export function EditForm({
  profile,
  onSaved,
  t,
}: {
  profile: UserProfile
  onSaved: () => void
  t: TFn
}) {
  const [error, setError] = useState<string | null>(null)

  const sexOptions = SEX_VALUES.map((v) => ({ value: v, label: sexLabel(t, v) }))
  const levelOptions = LEVEL_VALUES.map((v) => ({ value: v, label: activityLabel(t, v) }))

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    mode: 'onTouched',
    defaultValues: {
      name: profile.name,
      birthDate: profile.birthDate ?? '',
      sex: profile.sex ?? undefined,
      heightCm: profile.heightCm ?? undefined,
      weightKg: profile.weightKg ?? undefined,
      activityLevel: profile.activityLevel ?? undefined,
      timeZone: profile.timeZone,
    },
  })

  async function onSubmit(values: EditValues) {
    setError(null)
    try {
      await updateProfile({ ...values, goal: profile.goal as Goal })
      onSaved()
    } catch (err) {
      setError(getApiErrorMessage(err, t('profile.saveError')))
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
      className="mt-4 space-y-4 border-t border-hair pt-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('profile.name')}
          type="text"
          autoComplete="name"
          error={errors.name && t('profile.nameRequired')}
          {...register('name')}
        />
        <Field
          label={t('profile.birthDate')}
          error={errors.birthDate && t('profile.birthDateInvalid')}
          labelsAGroup
        >
          {(field) => (
            <Controller
              name="birthDate"
              control={control}
              render={({ field: f }) => (
                // aria-invalid is not allowed on a group, so the date field gets the name
                // and the description only; the message linked through the description
                // says what is wrong.
                <DateField
                  labelId={field.labelId}
                  aria-describedby={field['aria-describedby']}
                  value={f.value}
                  onChange={f.onChange}
                />
              )}
            />
          )}
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField
          label={t('profile.height')}
          unit="cm"
          min={50}
          max={300}
          step="any"
          error={errors.heightCm && t('profile.heightInvalid')}
          {...register('heightCm', { valueAsNumber: true })}
        />
        <NumberField
          label={t('profile.weight')}
          unit="kg"
          min={20}
          max={500}
          step="0.1"
          error={errors.weightKg && t('profile.weightInvalid')}
          {...register('weightKg', { valueAsNumber: true })}
        />
        <Field label={t('profile.sex')} error={errors.sex && t('profile.sexRequired')}>
          {(field) => (
            <Controller
              name="sex"
              control={control}
              render={({ field: f }) => (
                <Select
                  {...field}
                  value={f.value ?? ''}
                  onChange={f.onChange}
                  options={sexOptions}
                  placeholder={t('profile.chooseHint')}
                />
              )}
            />
          )}
        </Field>
      </div>
      <Field
        label={t('profile.activityLevel')}
        error={errors.activityLevel && t('profile.activityLevelRequired')}
      >
        {(field) => (
          <Controller
            name="activityLevel"
            control={control}
            render={({ field: f }) => (
              <Select
                {...field}
                value={f.value ?? ''}
                onChange={f.onChange}
                options={levelOptions}
                placeholder={t('profile.chooseHint')}
              />
            )}
          />
        )}
      </Field>
      <Controller
        name="timeZone"
        control={control}
        render={({ field: f }) => <TimeZoneField value={f.value} onChange={f.onChange} t={t} />}
      />
      <FormError message={error} />
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? t('profile.saving') : t('profile.saveData')}
      </button>
    </form>
  )
}
