import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Toaster } from 'sonner'

import { bootstrapSession } from '@/api/client'
import { AppRouter } from '@/router/AppRouter'
import { queryClient } from '@/shared/api/queryClient'
import { AppErrorBoundary } from '@/shared/ui/AppErrorBoundary'
import { RouteFallback } from '@/shared/ui/RouteFallback'
import { useAuthStore } from '@/store/authStore'

export default function App() {
  const bootstrapped = useAuthStore((s) => s.bootstrapped)

  // The access token is kept in memory, so every reload starts without one. The refresh
  // cookie survives, and this exchanges it for a fresh access token. Without it a logged-in
  // user would be bounced to the login page on every refresh.
  useEffect(() => {
    void bootstrapSession()
  }, [])

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* Routing before the refresh call answers would send a logged-in user to /login
            for a moment, so the app waits. This is one request against the same origin. */}
        {bootstrapped ? <AppRouter /> : <RouteFallback />}
        {/* Toasts live outside the router so a message survives a navigation: confirming
            a saved meal should still be readable on the screen it takes you to. */}
        <Toaster position="top-center" richColors closeButton />
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}
