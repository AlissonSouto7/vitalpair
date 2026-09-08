import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { closeAccount } from '@/api/profile'
import { getApiErrorMessage } from '@/shared/api/errors'
import { FormError } from '@/shared/ui/form/FormError'
import { useAuthStore } from '@/store/authStore'

/**
 * Closing the account.
 *
 * <p>Three steps rather than one: reveal, read, type the word. The gate is deliberate
 * friction, not ceremony, because this is the only action in the product that cannot be
 * undone and the button sits on a screen people open to change the theme. Typing a word
 * cannot be done by a mis-tap, which is what a second button can.
 *
 * The panel says plainly what survives. Someone closing an account deserves to know their
 * seasons stay in their partner's history before they press it, not afterwards.
 */
export function CloseAccountCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const clearSession = useAuthStore((s) => s.clear)

  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const word = t('settings.closeConfirmWord')
  const confirmed = typed.trim().toUpperCase() === word

  async function confirm() {
    if (!confirmed) return
    setClosing(true)
    setError(null)
    try {
      await closeAccount()
      // The session is already dead on the server; clearing here stops the app from
      // retrying with a token that will never work again.
      clearSession()
      navigate('/', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, t('settings.closeError')))
      setClosing(false)
    }
  }

  if (!open) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-hair bg-surface px-[18px] py-4">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-ink">{t('settings.closeAccount')}</p>
          <p className="mt-0.5 text-xs font-semibold text-muted">
            {t('settings.closeAccountHint')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-xl border border-danger/40 px-3.5 py-2 text-[13px] font-extrabold text-danger transition hover:bg-danger-soft"
        >
          {t('settings.closeAccount')}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-danger/30 bg-danger-soft/40 px-[18px] py-4">
      <h3 className="font-display text-base font-semibold text-ink">
        {t('settings.closeConfirmTitle')}
      </h3>
      <p className="mt-1.5 text-sm font-semibold leading-relaxed text-muted">
        {t('settings.closeConfirmText')}
      </p>

      <label className="mt-4 block">
        <span className="text-xs font-extrabold text-ink">
          {t('settings.closeConfirmPrompt', { word })}
        </span>
        <input
          type="text"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="input mt-1.5 uppercase tracking-[0.12em]"
        />
      </label>

      <FormError message={error} />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={!confirmed || closing}
          className="rounded-xl bg-danger px-4 py-2.5 text-sm font-extrabold text-white transition hover:brightness-105 disabled:opacity-50"
        >
          {closing ? t('settings.closing') : t('settings.closeConfirm')}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setTyped('')
            setError(null)
          }}
          disabled={closing}
          className="rounded-xl border border-hair bg-surface px-4 py-2.5 text-sm font-extrabold text-ink transition hover:border-brand disabled:opacity-60"
        >
          {t('settings.closeCancel')}
        </button>
      </div>
    </div>
  )
}
