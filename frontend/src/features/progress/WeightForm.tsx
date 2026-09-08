import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { recordWeight } from '@/api/progress'
import { getApiErrorMessage } from '@/shared/api/errors'
import { FormError } from '@/shared/ui/form/FormError'
import { NumberField } from '@/shared/ui/form/NumberField'

/**
 * The weights a person can plausibly have.
 *
 * Tighter than the endpoint on purpose. RecordWeightRequest accepts anything positive
 * below a thousand, while the profile form holds 20 to 500 for the very same quantity; a
 * log of 3 kg or 900 kg is a slip of the finger, not a measurement, and it drew a spike on
 * the chart. The server still guards positivity; this guard is about the slip.
 */
const schema = z.object({
  weightKg: z.number().min(20).max(500),
})

type WeightValues = z.infer<typeof schema>

interface WeightFormProps {
  label: string
  submitLabel: string
  placeholder: string
  /** Called after a successful save, so the caller can reload whatever shows the weight. */
  onLogged: () => Promise<void>
  className?: string
}

/**
 * Logs today's weight.
 *
 * The same form existed twice, copied between the progress and profile screens, and the
 * two copies had drifted: one caught a failed save and one did not, so on the profile a
 * person could be shown nothing and believe the weight had been recorded.
 */
export function WeightForm({
  label,
  submitLabel,
  placeholder,
  onLogged,
  className,
}: WeightFormProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WeightValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  })

  async function onSubmit(values: WeightValues) {
    setError(null)
    try {
      await recordWeight(values.weightKg)
      reset()
      await onLogged()
    } catch (err) {
      setError(getApiErrorMessage(err, t('progress.weightSaveError')))
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate className={className}>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <NumberField
            label={label}
            unit={t('progress.weightUnit')}
            placeholder={placeholder}
            min={20}
            max={500}
            step="0.1"
            error={errors.weightKg && t('progress.weightInvalid')}
            {...register('weightKg', { valueAsNumber: true })}
          />
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
          {isSubmitting ? t('common.saving') : submitLabel}
        </button>
      </div>
      <div className="mt-2">
        <FormError message={error} />
      </div>
    </form>
  )
}
