import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage'
import { VerifyEmailPage } from '../features/auth/VerifyEmailPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { NutritionPage } from '../features/nutrition/NutritionPage'
import { ActivityPage } from '../features/activity/ActivityPage'
import { FeedPage } from '../features/feed/FeedPage'
import { PairPage } from '../features/pair/PairPage'
import { InvitePage } from '../features/pair/InvitePage'
import { GamificationPage } from '../features/gamification/GamificationPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { LandingPage } from '../features/landing/LandingPage'
import { PrivacyPage } from '../features/legal/PrivacyPage'
import { TermsPage } from '../features/legal/TermsPage'
import { ContactPage } from '../features/legal/ContactPage'
import { OnboardingPage } from '../features/onboarding/OnboardingPage'
import { ProgressPage } from '../features/progress/ProgressPage'
import { MealPlanPage } from '../features/mealplan/MealPlanPage'
import { WorkoutPlanPage } from '../features/workoutplan/WorkoutPlanPage'
import { MissionsPage } from '../features/missions/MissionsPage'
import { SeasonPage } from '../features/season/SeasonPage'
import { SeasonEndPage } from '../features/season/SeasonEndPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { Layout } from '../components/Layout'
import { ProtectedRoute } from './ProtectedRoute'

/** Raiz: visitante deslogado vê a Landing; logado vai pro app. */
function RootEntry() {
  const accessToken = useAuthStore((s) => s.accessToken)
  return accessToken ? <Navigate to="/dashboard" replace /> : <LandingPage />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootEntry />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/privacidade" element={<PrivacyPage />} />
        <Route path="/termos" element={<TermsPage />} />
        <Route path="/contato" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/convite/:code" element={<InvitePage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/nutrition" element={<NutritionPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/meal-plan" element={<MealPlanPage />} />
            <Route path="/workout-plan" element={<WorkoutPlanPage />} />
            <Route path="/season" element={<SeasonPage />} />
            <Route path="/season-end" element={<SeasonEndPage />} />
            <Route path="/missions" element={<MissionsPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/gamification" element={<GamificationPage />} />
            <Route path="/pair" element={<PairPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
