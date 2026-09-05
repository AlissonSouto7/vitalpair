export type PlanMealType = 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'DINNER'

export interface PlanMeal {
  mealType: PlanMealType
  name: string
  kcal: number
  proteinG: number
  carbG: number
  fatG: number
}

export interface PlanDay {
  dayIndex: number
  date: string
  meals: PlanMeal[]
}

export interface MealPlan {
  weekStart: string
  targetKcal: number | null
  days: PlanDay[]
}

export interface WorkoutExercise {
  id: string
  name: string
  sets: number
  reps: string
  restSeconds: number
  done: boolean
}

export interface WorkoutToday {
  goal: string
  dayIndex: number
  rest: boolean
  focus: string | null
  durationMin: number | null
  completed: boolean
  exercises: WorkoutExercise[]
}
