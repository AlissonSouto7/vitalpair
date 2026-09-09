import { queryOptions } from '@tanstack/react-query'

import { getMealPlan } from '@/api/aiplan'

/** What the meal plan screen reads. */
export const mealPlanQueries = {
  /**
   * The week's plan, or null when the person has not generated one.
   *
   * Null is the normal state of a new account, not a failure, so the screen shows the
   * "generate one" call to action rather than an error.
   */
  plan: () =>
    queryOptions({
      queryKey: ['meal-plan'],
      queryFn: getMealPlan,
    }),
}
