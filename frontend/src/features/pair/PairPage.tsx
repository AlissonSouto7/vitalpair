import { useEffect, useState, type FormEvent } from 'react'
import { AxiosError } from 'axios'
import { getPair, joinPair } from '../../api/pair'
import { refreshSession } from '../../api/auth'
import type { Pair } from '../../types/pair'

export function PairPage() {
  const [pair, setPair] = useState<Pair | null>(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPair()
      .then(setPair)
      .catch(() => setError('Não foi possível carregar o par.'))
      .finally(() => setLoading(false))
  }, [])

  async function copyCode() {
    if (!pair) return
    await navigator.clipboard.writeText(pair.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleJoin(event: FormEvent) {
    event.preventDefault()
    setJoining(true)
    setError(null)
    try {
      const updated = await joinPair(code.trim().toUpperCase())
      // O tenant mudou: reemite o token para refletir o novo par.
      await refreshSession()
      setPair(updated)
      setCode('')
    } catch (err) {
      const message = err instanceof AxiosError ? err.response?.data?.message : null
      setError(message ?? 'Não foi possível entrar no par.')
    } finally {
      setJoining(false)
    }
  }

  if (loading) return <p className="text-slate-500">Carregando...</p>

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Seu par</h1>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {pair?.status === 'ACTIVE' ? (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="mb-3 font-semibold text-emerald-800">
            {pair.pairName ?? 'Vocês estão pareados!'} 🎉
          </p>
          <ul className="space-y-2">
            {pair.members.map((m) => (
              <li key={m.userId} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-200 text-sm font-bold text-emerald-800">
                  {m.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{m.name}</p>
                  <p className="text-xs text-slate-400">{m.email}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-1 text-sm font-semibold text-slate-700">Convide seu parceiro</h2>
            <p className="mb-3 text-xs text-slate-500">
              Compartilhe este código para que a outra pessoa entre no seu par.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-slate-100 px-4 py-3 text-center text-2xl font-bold tracking-widest text-blue-700">
                {pair?.inviteCode}
              </code>
              <button
                onClick={copyCode}
                className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </section>

          <div className="text-center text-sm text-slate-400">ou</div>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Tenho um código</h2>
            <form onSubmit={handleJoin} className="flex items-center gap-2">
              <input
                type="text"
                required
                placeholder="Código do parceiro"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 uppercase tracking-widest outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={joining}
                className="whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {joining ? 'Entrando...' : 'Entrar no par'}
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  )
}
