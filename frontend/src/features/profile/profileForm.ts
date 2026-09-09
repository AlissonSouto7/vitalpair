import type { TFunction } from 'i18next'
import { z } from 'zod'

import type { ActivityLevel, Goal, Sex } from '@/types/profile'

/** The translate function, typed against the pt bundle: a wrong key fails tsc. */
export type TFn = TFunction

/**
 * The values, labels and validation the profile screen and its edit form share.
 *
 * Their own module because the form moved out of the page and both still need them: a
 * second copy of the schema is how the two drift apart and the form starts accepting what
 * the page will not show.
 */

export const SEX_VALUES = ['MALE', 'FEMALE', 'OTHER'] as const satisfies readonly Sex[]
export const GOAL_VALUES: Goal[] = ['LOSE_WEIGHT', 'GAIN_MUSCLE', 'MAINTAIN', 'IMPROVE_FITNESS']
export const LEVEL_VALUES = [
  'SEDENTARY',
  'LIGHT',
  'MODERATE',
  'ACTIVE',
  'VERY_ACTIVE',
] as const satisfies readonly ActivityLevel[]

export const goalLabel = (t: TFn, g: Goal) => t(`profile.goalLabel.${g}`)
export const sexLabel = (t: TFn, s: Sex) => t(`profile.sexLabel.${s}`)
export const activityLabel = (t: TFn, l: ActivityLevel) => t(`profile.levelLabel.${l}`)

/**
 * Mirrors the backend's UpdateProfileRequest: the same bounds it enforces, so a person
 * hears about a slip here rather than after a round trip. The date field emits an empty
 * string until all three parts are chosen; the server's @Past is restated as "before
 * today".
 */
export const editSchema = z.object({
  name: z.string().trim().min(1).max(100),
  birthDate: z
    .string()
    .refine((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d < new Date().toISOString().slice(0, 10)),
  sex: z.enum(SEX_VALUES),
  heightCm: z.number().min(50).max(300),
  weightKg: z.number().min(20).max(500),
  activityLevel: z.enum(LEVEL_VALUES),
  timeZone: z.string().min(1),
})

export type EditValues = z.infer<typeof editSchema>
