import { z } from 'zod'

import { GOAL_VALUES, LEVEL_VALUES, profileSchema } from '../profile/profileForm'

/**
 * What the first two steps collect, which is the whole profile the server needs before it
 * can compute a target: step 1 is the person, step 2 how active their days are.
 *
 * One schema for both steps because they are sent in one request when step 2 is left.
 * Checking a step on its own is a matter of which fields `trigger` is asked about, not of
 * two schemas that could disagree with each other. Built on the profile's own schema
 * rather than restating its bounds, for the same reason.
 */
export const onboardingSchema = profileSchema.extend({
  goal: z.enum(GOAL_VALUES),
  activityLevel: z.enum(LEVEL_VALUES),
})

export type OnboardingValues = z.infer<typeof onboardingSchema>

/** The fields step 1 owns, so the page can validate that step before the routine exists. */
export const ABOUT_YOU_FIELDS = [
  'name',
  'weightKg',
  'heightCm',
  'birthDate',
  'sex',
  'goal',
] as const satisfies readonly (keyof OnboardingValues)[]
