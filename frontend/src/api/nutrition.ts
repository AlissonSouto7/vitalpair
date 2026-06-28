import { api } from './client'
import type { ApiResponse } from '../types/api'
import type {
  DailySummary,
  FavoriteFood,
  FoodLog,
  FoodProduct,
  LogMealPayload,
  PhotoAnalysis,
} from '../types/nutrition'

export async function searchFoods(query: string): Promise<FoodProduct[]> {
  const res = await api.get<ApiResponse<FoodProduct[]>>('/nutrition/foods/search', {
    params: { q: query },
  })
  return res.data.data
}

export async function logMeal(payload: LogMealPayload): Promise<FoodLog> {
  const res = await api.post<ApiResponse<FoodLog>>('/nutrition/logs', payload)
  return res.data.data
}

export async function getLogs(date?: string): Promise<FoodLog[]> {
  const res = await api.get<ApiResponse<FoodLog[]>>('/nutrition/logs', {
    params: date ? { date } : undefined,
  })
  return res.data.data
}

export async function deleteLog(id: string): Promise<void> {
  await api.delete(`/nutrition/logs/${id}`)
}

export async function getSummary(date?: string): Promise<DailySummary> {
  const res = await api.get<ApiResponse<DailySummary>>('/nutrition/summary', {
    params: date ? { date } : undefined,
  })
  return res.data.data
}

export async function getFavorites(): Promise<FavoriteFood[]> {
  const res = await api.get<ApiResponse<FavoriteFood[]>>('/nutrition/favorites')
  return res.data.data
}

export async function analyzePhoto(imageBase64: string, mediaType: string): Promise<PhotoAnalysis> {
  const res = await api.post<ApiResponse<PhotoAnalysis>>('/nutrition/photo', { imageBase64, mediaType })
  return res.data.data
}
