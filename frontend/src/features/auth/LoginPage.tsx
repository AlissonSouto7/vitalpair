import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import { useAuth } from '../../hooks/useAuth'
import { joinPair } from '../../api/pair'
import { GoogleLoginButton } from '../../components/GoogleLoginButton'
import { AuthShell } from '../../components/auth/AuthShell'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const invite = params.get('convite')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login({ email, password })
      if (invite) {
        await joinPair(invite.trim().toUpperCase()).catch(() => undefined)
      }
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof AxiosError ? err.response?.data?.message : null
      setError(message ?? 'Não rolou entrar. Confere o email e a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="mb-1.5 font-display text-[28px] font-semibold tracking-tight text-ink">Bora de novo</h1>
      <p className="mb-6 text-sm font-semibold text-muted">Entra aí pra ver se você ainda tá ganhando.</p>

      {invite && (
        <p className="mb-4 rounded-xl bg-rival-soft px-4 py-2.5 text-sm font-bold text-rival-ink">
          Entra que eu já te coloco na dupla que te convidaram.
        </p>
      )}

      <div className="mb-4 flex justify-center">
        <GoogleLoginButton onError={setError} />
      </div>

      <div className="mb-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-hair" />
        <span className="text-[11px] font-bold text-muted">ou com email</span>
        <span className="h-px flex-1 bg-hair" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="label mb-0">Senha</label>
            <Link to="/forgot-password" className="text-xs font-extrabold text-brand-ink hover:underline">
              Esqueci
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </div>

        {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm font-semibold text-muted">
        Ainda não tem conta?{' '}
        <Link to="/register" className="font-extrabold text-brand-ink hover:underline">
          Cria uma aí
        </Link>
      </p>
    </AuthShell>
  )
}
