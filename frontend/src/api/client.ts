import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8081/api/v1'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Refresh único e compartilhado entre requisições concorrentes que tomarem 401.
let refreshing: Promise<string> | null = null

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await axios.post(`${baseURL}/auth/refresh`, { refreshToken })
  const data = response.data.data
  useAuthStore.getState().setSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    userId: data.userId,
  })
  return data.accessToken as string
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const store = useAuthStore.getState()

    if (error.response?.status === 401 && original && !original._retry && store.refreshToken) {
      original._retry = true
      try {
        if (!refreshing) {
          refreshing = refreshAccessToken(store.refreshToken).finally(() => {
            refreshing = null
          })
        }
        const newToken = await refreshing
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshError) {
        useAuthStore.getState().clear()
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  },
)
