import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getProfile } from '../api/profile'
import { resendVerification } from '../api/auth'

/** Aviso discreto, não-bloqueante: aparece só enquanto a conta não tiver e-mail confirmado. */
export function EmailVerificationBanner() {
  const { t } = useTranslation()
  const [email, setEmail] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    getProfile()
      .then((p) => {
        if (!p.emailVerified) setEmail(p.email)
      })
      .catch(() => {})
  }, [])

  if (!email) return null

  async function handleResend() {
    if (!email) return
    setSending(true)
    try {
      await resendVerification(email)
      setResent(true)
    } catch {
      // silencioso: aviso não-bloqueante
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-warn sm:flex-row sm:items-center sm:justify-between">
      <span>⚠️ {t('verifyEmail.bannerText')}</span>
      {resent ? (
        <span className="font-semibold">{t('verifyEmail.bannerResent')}</span>
      ) : (
        <button
          onClick={handleResend}
          disabled={sending}
          className="shrink-0 rounded-lg border border-amber-500/40 px-3 py-1 font-semibold transition hover:bg-amber-500/20 disabled:opacity-60"
        >
          {sending ? t('auth.sending') : t('verifyEmail.bannerResend')}
        </button>
      )}
    </div>
  )
}
