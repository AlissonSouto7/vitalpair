import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { googleLogin } from '../api/auth'
import { useAuthStore } from '../store/authStore'

interface GoogleAccounts {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (res: { credential: string }) => void }) => void
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
    }
  }
}

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts['accounts'] }
  }
}

export function GoogleLoginButton({ onError }: { onError?: (message: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

  useEffect(() => {
    if (!clientId) return
    let attempts = 0

    function tryInit() {
      if (!window.google || !containerRef.current) {
        if (attempts++ < 40) setTimeout(tryInit, 100)
        return
      }
      window.google.accounts.id.initialize({
        client_id: clientId!,
        callback: async (res) => {
          try {
            const token = await googleLogin(res.credential)
            setSession({
              accessToken: token.accessToken,
              refreshToken: token.refreshToken,
              userId: token.userId,
            })
            navigate('/dashboard')
          } catch {
            onError?.('Não foi possível entrar com o Google.')
          }
        },
      })
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: 300,
        locale: 'pt-BR',
      })
    }

    tryInit()
  }, [clientId, navigate, setSession, onError])

  if (!clientId) return null
  return <div ref={containerRef} className="flex justify-center" />
}
