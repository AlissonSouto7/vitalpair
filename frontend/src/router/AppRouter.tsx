import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import { NotFoundPage } from '@/shared/ui/NotFoundPage'
import { RouteFallback } from '@/shared/ui/RouteFallback'
import { useAuthStore } from '@/store/authStore'

/*
 * Every page is loaded on demand.
 *
 * With static imports the whole application shipped as one file of 742 kB, so a visitor
 * opening the login screen downloaded all 27 screens, the charts and the onboarding flow
 * to see a form with two fields. Vite splits a dynamic import into its own chunk, so each
 * screen now arrives when it is opened.
 *
 * The landing and login pages are the first thing an anonymous visitor sees, and they are
 * loaded the same way: the cost of a second request is far smaller than the cost of
 * downloading everything else with them.
 */
const LandingPage = lazy(() =>
  import('@/features/landing/LandingPage').then((m) => ({ default: m.LandingPage })),
)
const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const RegisterPage = lazy(() =>
  import('@/features/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
)
const ResetPasswordPage = lazy(() =>
  import('@/features/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
)
const VerifyEmailPage = lazy(() =>
  import('@/features/auth/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })),
)
const PrivacyPage = lazy(() =>
  import('@/features/legal/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
)
const TermsPage = lazy(() =>
  import('@/features/legal/TermsPage').then((m) => ({ default: m.TermsPage })),
)
const ContactPage = lazy(() =>
  import('@/features/legal/ContactPage').then((m) => ({ default: m.ContactPage })),
)
const InvitePage = lazy(() =>
  import('@/features/pair/InvitePage').then((m) => ({ default: m.InvitePage })),
)
const OnboardingPage = lazy(() =>
  import('@/features/onboarding/OnboardingPage').then((m) => ({ default: m.OnboardingPage })),
)
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const NutritionPage = lazy(() =>
  import('@/features/nutrition/NutritionPage').then((m) => ({ default: m.NutritionPage })),
)
const ActivityPage = lazy(() =>
  import('@/features/activity/ActivityPage').then((m) => ({ default: m.ActivityPage })),
)
const FeedPage = lazy(() =>
  import('@/features/feed/FeedPage').then((m) => ({ default: m.FeedPage })),
)
const MealPlanPage = lazy(() =>
  import('@/features/mealplan/MealPlanPage').then((m) => ({ default: m.MealPlanPage })),
)
const WorkoutPlanPage = lazy(() =>
  import('@/features/workoutplan/WorkoutPlanPage').then((m) => ({ default: m.WorkoutPlanPage })),
)
const SeasonPage = lazy(() =>
  import('@/features/season/SeasonPage').then((m) => ({ default: m.SeasonPage })),
)
const SeasonEndPage = lazy(() =>
  import('@/features/season/SeasonEndPage').then((m) => ({ default: m.SeasonEndPage })),
)
const MissionsPage = lazy(() =>
  import('@/features/missions/MissionsPage').then((m) => ({ default: m.MissionsPage })),
)
const ProgressPage = lazy(() =>
  import('@/features/progress/ProgressPage').then((m) => ({ default: m.ProgressPage })),
)
const GamificationPage = lazy(() =>
  import('@/features/gamification/GamificationPage').then((m) => ({ default: m.GamificationPage })),
)
const PairPage = lazy(() =>
  import('@/features/pair/PairPage').then((m) => ({ default: m.PairPage })),
)
const ProfilePage = lazy(() =>
  import('@/features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)

/** Raiz: visitante deslogado vê a Landing; logado vai pro app. */
function RootEntry() {
  const accessToken = useAuthStore((s) => s.accessToken)
  return accessToken ? <Navigate to="/dashboard" replace /> : <LandingPage />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      {/* One boundary around the whole tree: a route's code is fetched when it is opened,
          and every route needs the same placeholder while that happens. */}
      <Suspense fallback={<RouteFallback />}>
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
          {/* A real 404. Redirecting an unknown path to the dashboard sent a logged-out
              visitor to the login screen for no stated reason, and hid broken links. */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
