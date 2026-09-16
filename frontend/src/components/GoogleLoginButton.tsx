import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { googleLogin } from '../api/auth'
import { useAuthStore } from '../store/authStore'

interface GoogleAccounts {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string
        callback: (res: { credential: string }) => void
      }) => void
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
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  /*
    O `t` vive num ref porque o efeito não pode depender dele. Incluí-lo nas deps faria o
    efeito rodar a cada troca de idioma e reinicializar o widget do Google, que é um script
    externo: o botão pisca e o estado dele se perde. E deixá-lo fora das deps sem o ref
    congelaria a mensagem de erro no idioma em que a tela montou. O ref é lido só quando o
    login falha, então pega sempre a tradução atual.
  */
  const tRef = useRef(t)
  // A escrita vai num efeito próprio, e não no corpo do componente, porque mexer num ref
  // durante o render é o que quebra o render concorrente (o React pode descartar a passada).
  useEffect(() => {
    tRef.current = t
  }, [t])
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

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
        // Google's callback signature returns void, so an async function here is a
        // promise nobody can await. Safe because the body catches everything itself:
        // there is no rejection to escape. Wrapped rather than left implicit so the
        // guarantee is visible at the call site.
        callback: (res) => {
          void (async () => {
            try {
              const token = await googleLogin(res.credential)
              setSession({ accessToken: token.accessToken, userId: token.userId })
              void navigate('/dashboard')
            } catch {
              onError?.(tRef.current('auth.errorGoogle'))
            }
          })()
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
