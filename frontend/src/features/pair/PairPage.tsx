import { useEffect, useState, type FormEvent } from 'react'
import { AxiosError } from 'axios'
import { getPair, joinPair, updateRelationshipType } from '../../api/pair'
import { refreshSession } from '../../api/auth'
import { Select } from '../../components/ui/Select'
import type { Pair, RelationshipType } from '../../types/pair'

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string }[] = [
  { value: 'PAIR', label: 'Casal' },
  { value: 'DUO', label: 'Dupla' },
  { value: 'FRIENDS', label: 'Amigos' },
  { value: 'CONFIDANTS', label: 'Confidentes' },
  { value: 'BROTHERS', label: 'Brothers' },
  { value: 'OTHER', label: 'Outro' },
]

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
      .catch(() => setError('Não foi possível carregar a relação.'))
      .finally(() => setLoading(false))
  }, [])

  async function changeType(type: RelationshipType) {
    try {
      const updated = await updateRelationshipType(type)
      setPair(updated)
    } catch {
      setError('Não foi possível atualizar o tipo de relação.')
    }
  }

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
      await refreshSession()
      setPair(updated)
      setCode('')
    } catch (err) {
      const message = err instanceof AxiosError ? err.response?.data?.message : null
      setError(message ?? 'Não foi possível entrar na relação.')
    } finally {
      setJoining(false)
    }
  }

  if (loading) return <p className="text-slate-400">Carregando...</p>

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="text-2xl font-extrabold">Sua relação</h1>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      <div className="card">
        <label className="label">Tipo de relação</label>
        <Select value={pair?.relationshipType ?? 'PAIR'} onChange={changeType} options={RELATIONSHIP_OPTIONS} />
      </div>

      {pair?.status === 'ACTIVE' ? (
        <div className="card glow-lime">
          <p className="mb-3 font-bold text-lime-300">{pair.pairName ?? 'Vocês estão conectados!'} 🎉</p>
          <ul className="space-y-2">
            {pair.members.map((m) => (
              <li key={m.userId} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/40 px-3 py-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-400 text-sm font-bold text-slate-950">
                  {m.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-100">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.email}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className="card">
            <h2 className="mb-1 text-sm font-semibold text-slate-300">Convide a outra pessoa</h2>
            <p className="mb-3 text-xs text-slate-500">Compartilhe este código para a outra pessoa entrar na sua relação.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-center text-2xl font-extrabold tracking-[0.3em] text-lime-400">
                {pair?.inviteCode}
              </code>
              <button onClick={copyCode} className="btn-primary px-4 py-3">
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          <div className="text-center text-sm text-slate-600">ou</div>

          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-slate-300">Tenho um código</h2>
            <form onSubmit={handleJoin} className="flex items-center gap-2">
              <input
                type="text"
                required
                placeholder="Código recebido"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input uppercase tracking-[0.3em]"
              />
              <button type="submit" disabled={joining} className="btn-primary whitespace-nowrap text-sm">
                {joining ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
