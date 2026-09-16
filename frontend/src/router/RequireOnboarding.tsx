import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { profileQueries } from '@/features/profile/queries'
import { RouteFallback } from '@/shared/ui/RouteFallback'

/**
 * Sends an account that never finished onboarding back to it.
 *
 * Registration used to sign people in and take them straight to onboarding, so arriving
 * inside the app with an empty profile was not reachable. It is now: registration only
 * sends the activation e-mail, and everyone comes in through the sign-in screen, which
 * goes to the dashboard. Without this guard a new account lands on a dashboard with no
 * calorie target, no goal and no season, which is the product with its centre removed.
 *
 * The profile is the state, rather than a "finished onboarding" flag: the first step is
 * what persists, and a flag would be a second source of truth that can disagree with it.
 * That also covers the ways in that never touched registration, Google sign-in among them.
 */
export function RequireOnboarding() {
  const location = useLocation()
  const profile = useQuery(profileQueries.profile())

  // While the answer is in flight, the placeholder every route already shows. `isPending`
  // alone is not enough: after onboarding saves the profile it invalidates this query, and
  // between the invalidation and the answer the state is "success" carrying the empty
  // profile read on the way in. Deciding on that sent people who had just finished
  // straight back to the first step, which is where the loop came from.
  if (profile.isPending || profile.isFetching) return <RouteFallback />

  // A profile that failed to load is not proof of anything: the screens below handle
  // their own errors, and redirecting on a network blip would trap someone in a loop.
  const needsOnboarding = profile.isSuccess && profile.data.goal === null

  return needsOnboarding ? (
    <Navigate to="/onboarding" state={{ from: location.pathname }} replace />
  ) : (
    <Outlet />
  )
}
