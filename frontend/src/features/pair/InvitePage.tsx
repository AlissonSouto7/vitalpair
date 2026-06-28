import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getInvitePreview, joinPair } from '../../api/pair'
import { refreshSession } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { BrandMark } from '../../components/brand/BrandMark'
import type { InvitePreview } from '../../types/pair'

type State =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'full' }
  | { kind: 'ok'; preview: InvitePreview }

export function InvitePage() {
  const { t } = useTranslation()
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  useEffect(() => {
    getInvitePreview(code)
      .then((preview) => setState(preview.full ? { kind: 'full' } : { kind: 'ok', preview }))
      .catch(() => setState({ kind: 'error' }))
  }, [code])

  async function accept() {
    // Deslogado: manda pro cadastro segurando o código (entra na dupla depois do cadastro).
    if (!accessToken) {
      navigate(`/register?convite=${encodeURIComponent(code)}`)
      return
    }
    setJoining(true)
    setJoinError(null)
    try {
      await joinPair(code.trim().toUpperCase())
      await refreshSession()
      navigate('/dashboard')
    } catch {
      setJoinError(t('pair.inviteJoinError'))
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <BrandMark size={40} />
        </div>

        {state.kind === 'loading' && (
          <p className="text-center font-bold text-muted">{t('pair.inviteOpening')}</p>
        )}

        {state.kind === 'error' && (
          <Card>
            <h1 className="font-display text-2xl font-semibold text-ink">{t('pair.inviteNotFoundTitle')}</h1>
            <p className="mt-2 text-sm font-semibold text-muted">
              {t('pair.inviteNotFoundText')}
            </p>
            <Link to="/" className="btn-ghost mt-5 inline-flex">
              {t('pair.backHome')}
            </Link>
          </Card>
        )}

        {state.kind === 'full' && (
          <Card>
            <h1 className="font-display text-2xl font-semibold text-ink">{t('pair.inviteUsedTitle')}</h1>
            <p className="mt-2 text-sm font-semibold text-muted">
              {t('pair.inviteUsedText')}
            </p>
            <Link to={accessToken ? '/dashboard' : '/login'} className="btn-primary mt-5 inline-flex">
              {accessToken ? t('pair.goToApp') : t('pair.enter')}
            </Link>
          </Card>
        )}

        {state.kind === 'ok' && (
          <Card>
            {/* avatares: você (laranja) + quem convidou (roxo) */}
            <div className="mb-4 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-[28%] border-2 border-dashed border-brand/50 font-display text-xl font-semibold text-brand">
                ?
              </span>
              <span className="z-10 -mx-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-success text-white">
                <IconLink />
              </span>
              <span className="flex h-14 w-14 items-center justify-center rounded-[28%] bg-rival-soft font-display text-xl font-semibold text-rival-ink">
                {initial(state.preview.inviterName)}
              </span>
            </div>

            <h1 className="font-display text-2xl font-semibold leading-tight text-ink">
              {t('pair.inviteCalledYou', { name: state.preview.inviterName })}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm font-semibold text-muted">
              {t('pair.inviteWaiting')}
            </p>

            <div className="mt-5 rounded-2xl border-[1.5px] border-dashed border-rival bg-rival-soft px-4 py-3.5 text-center">
              <span className="font-display text-2xl font-semibold tracking-[0.22em] text-rival-ink">
                {code.toUpperCase()}
              </span>
            </div>

            {joinError && (
              <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{joinError}</p>
            )}

            <button
              type="button"
              onClick={accept}
              disabled={joining}
              className="btn-primary mt-5 w-full disabled:opacity-60"
            >
              {joining ? t('pair.joining') : t('pair.acceptStart')}
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-3 w-full text-sm font-bold text-muted transition hover:text-ink"
            >
              {t('pair.notNow')}
            </button>

            {!accessToken && (
              <p className="mt-4 text-center text-xs font-semibold text-muted">
                {t('pair.alreadyHaveAccount')}{' '}
                <Link to={`/login?convite=${encodeURIComponent(code)}`} className="font-extrabold text-brand-ink hover:underline">
                  {t('pair.loginAndAccept')}
                </Link>
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}

function Card({ children }: { children: ReactNode }) {
  return <div className="card text-center">{children}</div>
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

function IconLink() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M3.9 12a3.1 3.1 0 0 1 3.1-3.1h4V7H7a5 5 0 0 0 0 10h4v-1.9H7A3.1 3.1 0 0 1 3.9 12zM8 13h8v-2H8v2zm9-6h-4v1.9h4a3.1 3.1 0 0 1 0 6.2h-4V17h4a5 5 0 0 0 0-10z" />
    </svg>
  )
}
