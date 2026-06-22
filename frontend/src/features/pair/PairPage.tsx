import { useEffect, useState, type FormEvent } from 'react'
import { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { getPair, joinPair, updateRelationshipType } from '../../api/pair'
import { refreshSession } from '../../api/auth'
import { Select } from '../../components/ui/Select'
import type { Pair, RelationshipType } from '../../types/pair'

const RELATIONSHIP_VALUES: RelationshipType[] = ['PAIR', 'DUO', 'FRIENDS', 'CONFIDANTS', 'BROTHERS', 'OTHER']

export function PairPage() {
  const { t } = useTranslation()
  const relationshipOptions = RELATIONSHIP_VALUES.map((v) => ({ value: v, label: t(`pair.rel.${v}`) }))
  const [pair, setPair] = useState<Pair | null>(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPair()
      .then(setPair)
      .catch(() => setError(t('pair.loadError')))
      .finally(() => setLoading(false))
  }, [t])

  async function changeType(type: RelationshipType) {
    try {
      const updated = await updateRelationshipType(type)
      setPair(updated)
    } catch {
      setError(t('pair.typeError'))
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
      setError(message ?? t('pair.joinError'))
    } finally {
      setJoining(false)
    }
  }

  if (loading) return <p className="text-muted">{t('common.loading')}</p>

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="text-2xl font-extrabold">{t('pair.title')}</h1>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}

      <div className="card">
        <label className="label">{t('pair.type')}</label>
        <Select value={pair?.relationshipType ?? 'PAIR'} onChange={changeType} options={relationshipOptions} />
      </div>

      {pair?.status === 'ACTIVE' ? (
        <div className="card glow-lime">
          <p className="mb-3 font-bold text-accent">{pair.pairName ?? t('pair.connected')} 🎉</p>
          <ul className="space-y-2">
            {pair.members.map((m) => (
              <li key={m.userId} className="flex items-center gap-3 rounded-xl border border-line bg-surface2/40 px-3 py-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-400 text-sm font-bold text-slate-950">
                  {m.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{m.name}</p>
                  <p className="text-xs text-faint">{m.email}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className="card">
            <h2 className="mb-1 text-sm font-semibold text-ink">{t('pair.invite')}</h2>
            <p className="mb-3 text-xs text-faint">{t('pair.inviteHint')}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-xl border border-line bg-surface2/60 px-4 py-3 text-center text-2xl font-extrabold tracking-[0.3em] text-accent">
                {pair?.inviteCode}
              </code>
              <button onClick={copyCode} className="btn-primary px-4 py-3">
                {copied ? t('pair.copied') : t('pair.copy')}
              </button>
            </div>
          </div>

          <div className="text-center text-sm text-faint">{t('common.or')}</div>

          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ink">{t('pair.haveCode')}</h2>
            <form onSubmit={handleJoin} className="flex items-center gap-2">
              <input
                type="text"
                required
                placeholder={t('pair.codePlaceholder')}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input uppercase tracking-[0.3em]"
              />
              <button type="submit" disabled={joining} className="btn-primary whitespace-nowrap text-sm">
                {joining ? t('pair.entering') : t('pair.enter')}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
