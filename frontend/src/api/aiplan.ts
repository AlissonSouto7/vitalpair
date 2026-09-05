import { api } from './client'
import type { ApiResponse } from '../types/api'
import type { MealPlan, PlanMealType, WorkoutToday } from '../types/aiplan'

// Gerações por IA demoram (a semana inteira vem num tiro só).
const SLOW = { timeout: 90000 }

export async function getMealPlan(): Promise<MealPlan | null> {
  const res = await api.get<ApiResponse<MealPlan | null>>('/meal-plan')
  return res.data.data
}

export async function generateMealPlan(): Promise<MealPlan> {
  const res = await api.post<ApiResponse<MealPlan>>('/meal-plan/generate', undefined, SLOW)
  return res.data.data
}

export async function swapMeal(dayIndex: number, mealType: PlanMealType): Promise<MealPlan> {
  const res = await api.post<ApiResponse<MealPlan>>('/meal-plan/swap', { dayIndex, mealType }, SLOW)
  return res.data.data
}

export async function getWorkoutToday(): Promise<WorkoutToday | null> {
  const res = await api.get<ApiResponse<WorkoutToday | null>>('/workout-plan/today')
  return res.data.data
}

export async function generateWorkoutPlan(): Promise<WorkoutToday | null> {
  const res = await api.post<ApiResponse<WorkoutToday | null>>(
    '/workout-plan/generate',
    undefined,
    SLOW,
  )
  return res.data.data
}

export async function toggleExercise(id: string): Promise<WorkoutToday> {
  const res = await api.post<ApiResponse<WorkoutToday>>(`/workout-plan/exercises/${id}/toggle`)
  return res.data.data
}

export async function completeWorkout(): Promise<WorkoutToday> {
  const res = await api.post<ApiResponse<WorkoutToday>>('/workout-plan/complete')
  return res.data.data
}
