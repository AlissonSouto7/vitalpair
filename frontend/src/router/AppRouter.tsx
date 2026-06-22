import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { NutritionPage } from '../features/nutrition/NutritionPage'
import { ActivityPage } from '../features/activity/ActivityPage'
import { FeedPage } from '../features/feed/FeedPage'
import { PairPage } from '../features/pair/PairPage'
import { GamificationPage } from '../features/gamification/GamificationPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { Layout } from '../components/Layout'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/nutrition" element={<NutritionPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/pair" element={<PairPage />} />
            <Route path="/gamification" element={<GamificationPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
