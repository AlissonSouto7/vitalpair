import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import type { OnboardingValues } from './onboardingForm'
import { GoalCard, StepHeader, StepWrap, Unit, type GoalTone } from './StepParts'

import { DateField } from '@/components/ui/DateField'
import { Select } from '@/components/ui/Select'
import { Field } from '@/shared/ui/form/Field'
import { TextField } from '@/shared/ui/form/TextField'
import type { Goal, Sex } from '@/types/profile'

/**
 * Step 1: who the person is, and what they are here for.
 *
 * The form belongs to the page rather than to this step: leaving step 2 sends all of this
 * to the server in one request, and coming back here has to show what was typed. This
 * component reads the form through its context and owns nothing. Its job is the fields
 * and the message next to each one, which used to be a single banner that said "fill in
 * everything" without saying what was missing.
 */
export function StepAboutYou({
  t,
  sexOptions,
  goalOptions,
}: {
  t: TFunction
  sexOptions: { value: Sex; label: string }[]
  goalOptions: { value: Goal; label: string; hint: string; icon: ReactNode; tone: GoalTone }[]
}) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<OnboardingValues>()

  return (
    <StepWrap>
      <StepHeader title={t('onboarding.step1Title')} subtitle={t('onboarding.step1Subtitle')} />

      <div className="mb-4">
        <TextField
          label={t('onboarding.nameLabel')}
          type="text"
          autoComplete="name"
          placeholder={t('onboarding.namePlaceholder')}
          error={errors.name && t('onboarding.nameRequired')}
          {...register('name')}
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Field
          label={t('onboarding.weightLabel')}
          error={errors.weightKg && t('onboarding.weightInvalid')}
        >
          {(field) => (
            <Unit unit="kg">
              <input
                id={field.id}
                aria-describedby={field['aria-describedby']}
                aria-invalid={field['aria-invalid']}
                type="number"
                min={20}
                max={500}
                step="0.1"
                inputMode="decimal"
                placeholder="78"
                className="input pr-10"
                {...register('weightKg', { valueAsNumber: true })}
              />
            </Unit>
          )}
        </Field>
        <Field
          label={t('onboarding.heightLabel')}
          error={errors.heightCm && t('onboarding.heightInvalid')}
        >
          {(field) => (
            <Unit unit="cm">
              <input
                id={field.id}
                aria-describedby={field['aria-describedby']}
                aria-invalid={field['aria-invalid']}
                type="number"
                min={50}
                max={300}
                step="1"
                inputMode="numeric"
                placeholder="179"
                className="input pr-10"
                {...register('heightCm', { valueAsNumber: true })}
              />
            </Unit>
          )}
        </Field>
      </div>

      <div className="mb-4">
        <Field
          label={t('onboarding.birthLabel')}
          error={errors.birthDate && t('onboarding.birthDateInvalid')}
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

      <div className="mb-5">
        <Field label={t('onboarding.sexLabel')} error={errors.sex && t('onboarding.sexRequired')}>
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
                  placeholder={t('onboarding.sexPlaceholder')}
                />
              )}
            />
          )}
        </Field>
      </div>

      {/* A set of cards, not a single control: the group carries the name and the
          description, the way the date does. */}
      <Field
        label={t('onboarding.focusLabel')}
        error={errors.goal && t('onboarding.goalRequired')}
        labelsAGroup
      >
        {(field) => (
          <Controller
            name="goal"
            control={control}
            render={({ field: f }) => (
              <div
                role="group"
                aria-labelledby={field.labelId}
                aria-describedby={field['aria-describedby']}
                className="grid gap-2.5 sm:grid-cols-2"
              >
                {goalOptions.map((g) => (
                  <GoalCard
                    key={g.value}
                    active={f.value === g.value}
                    label={g.label}
                    hint={g.hint}
                    icon={g.icon}
                    tone={g.tone}
                    onClick={() => f.onChange(g.value)}
                  />
                ))}
              </div>
            )}
          />
        )}
      </Field>
    </StepWrap>
  )
}
