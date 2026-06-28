import { useEffect, useState, type FormEvent } from 'react'
import { AxiosError } from 'axios'
import { getPair, joinPair, updateRelationshipType } from '../../api/pair'
import { refreshSession } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { Avatar } from '../../components/ui/Avatar'
import { Select } from '../../components/ui/Select'
import { BrandMark } from '../../components/brand/BrandMark'
import type { Pair, PairMember, RelationshipType } from '../../types/pair'

const RELATIONSHIP_VALUES: RelationshipType[] = ['PAIR', 'DUO', 'FRIENDS', 'CONFIDANTS', 'BROTHERS', 'OTHER']

const REL_LABEL: Record<RelationshipType, string> = {
  PAIR: 'Casal',
  DUO: 'Dupla',
  FRIENDS: 'Amigos',
  CONFIDANTS: 'Confidentes',
  BROTHERS: 'Brothers',
  OTHER: 'Outro',
}

const relationshipOptions = RELATIONSHIP_VALUES.map((v) => ({ value: v, label: REL_LABEL[v] }))

export function PairPage() {
  const userId = useAuthStore((s) => s.userId)
  const [pair, setPair] = useState<Pair | null>(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPair()
      .then(setPair)
      .catch(() => setError('Não rolou carregar sua dupla agora. Tenta de novo daqui a pouco.'))
      .finally(() => setLoading(false))
  }, [])

  async function changeType(type: RelationshipType) {
    try {
      const updated = await updateRelationshipType(type)
      setPair(updated)
    } catch {
      setError('Não consegui trocar o tipo de relação. Tenta de novo.')
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
      setError(message ?? 'Esse código não colou. Confere se digitou certinho.')
    } finally {
      setJoining(false)
    }
  }

  if (loading) return <p className="text-muted">Carregando...</p>

  const isActive = pair?.status === 'ACTIVE'
  const me = pair?.members.find((m) => m.userId === userId) ?? null
  const partner = pair?.members.find((m) => m.userId !== userId) ?? null

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {isActive ? 'Vocês são uma dupla' : 'Chama seu par'}
        </h1>
        <p className="text-sm text-muted">
          {isActive
            ? 'Bora começar a temporada juntos. Quem vacilar, paga.'
            : 'Ninguém cuida da saúde sozinho por muito tempo. Joga essa com alguém.'}
        </p>
      </header>

      {error && (
        <p className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          <IconAlert />
          {error}
        </p>
      )}

      {isActive && pair ? (
        <PairFormed pair={pair} me={me} partner={partner} onChangeType={changeType} />
      ) : (
        <InvitePanel
          pair={pair}
          me={me}
          copied={copied}
          onCopy={copyCode}
          code={code}
          onCodeChange={setCode}
          onJoin={handleJoin}
          joining={joining}
          onChangeType={changeType}
        />
      )}
    </div>
  )
}

/* ---------- dupla formada ---------- */

function PairFormed({
  pair,
  me,
  partner,
  onChangeType,
}: {
  pair: Pair
  me: PairMember | null
  partner: PairMember | null
  onChangeType: (t: RelationshipType) => void
}) {
  return (
    <>
      <div className="card glow-lime relative overflow-hidden text-center">
        <span className="absolute right-4 top-4">
          <BrandMark size={28} />
        </span>

        <div className="mb-4 flex items-center justify-center">
          <Avatar initial={initial(me?.name)} tone="you" size={56} />
          <span className="z-10 -mx-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-success text-white">
            <IconLink />
          </span>
          <Avatar initial={initial(partner?.name)} tone="rival" size={56} />
        </div>

        <p className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-extrabold text-success-ink">
          <IconCheck />
          Dupla formada
        </p>
        <h2 className="mt-3 font-display text-xl font-semibold text-ink">
          {pair.pairName ?? `${firstName(me?.name)} & ${firstName(partner?.name)}`}
        </h2>
        <p className="mt-1 text-sm text-muted">Tá valendo. O placar já começou a contar.</p>
      </div>

      <div className="space-y-3">
        <MemberRow member={me} tone="you" tag="você" />
        <MemberRow member={partner} tone="rival" tag="seu par" />
      </div>

      <RelationCard pair={pair} onChange={onChangeType} />
    </>
  )
}

function MemberRow({ member, tone, tag }: { member: PairMember | null; tone: 'you' | 'rival'; tag: string }) {
  const tagCls =
    tone === 'you'
      ? 'bg-brand-soft text-brand-ink'
      : 'bg-rival-soft text-rival-ink'
  return (
    <div className="card flex items-center gap-3 py-3.5">
      <Avatar initial={initial(member?.name)} tone={tone} size={44} art={member?.avatarUrl ?? undefined} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{member?.name ?? '—'}</p>
        <p className="truncate text-xs text-faint">{member?.email ?? ''}</p>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${tagCls}`}>
        {tag}
      </span>
    </div>
  )
}

/* ---------- ainda sem par: convite + entrar ---------- */

function InvitePanel({
  pair,
  me,
  copied,
  onCopy,
  code,
  onCodeChange,
  onJoin,
  joining,
  onChangeType,
}: {
  pair: Pair | null
  me: PairMember | null
  copied: boolean
  onCopy: () => void
  code: string
  onCodeChange: (v: string) => void
  onJoin: (e: FormEvent) => void
  joining: boolean
  onChangeType: (t: RelationshipType) => void
}) {
  return (
    <>
      <div className="card relative overflow-hidden text-center">
        <span className="absolute right-4 top-4">
          <BrandMark size={28} />
        </span>

        <div className="mb-4 flex items-center justify-center">
          <Avatar initial={initial(me?.name)} tone="you" size={52} />
          <span className="z-10 -mx-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-track text-muted">
            <IconPlus />
          </span>
          <span
            className="flex shrink-0 items-center justify-center rounded-[28%] border-2 border-dashed border-rival/50 text-rival"
            style={{ width: 52, height: 52 }}
          >
            <IconQuestion />
          </span>
        </div>

        <h2 className="font-display text-lg font-semibold text-ink">Manda esse código pro seu par</h2>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
          Ele entra com o código e vocês já começam a temporada juntos.
        </p>

        <div className="mt-5 flex items-center justify-between gap-2 rounded-2xl border-[1.5px] border-dashed border-rival bg-rival-soft px-4 py-3.5">
          <span className="font-display text-2xl font-semibold tracking-[0.22em] text-rival-ink">
            {pair?.inviteCode ?? '----'}
          </span>
          <button
            type="button"
            onClick={onCopy}
            aria-label="Copiar código"
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-extrabold transition ${
              copied
                ? 'bg-success text-white'
                : 'bg-rival text-white hover:brightness-105'
            }`}
          >
            {copied ? <IconCheck /> : <IconCopy />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>

        <CopyLinkButton code={pair?.inviteCode ?? ''} />
      </div>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-hair" />
        <span className="text-[11px] font-bold uppercase tracking-wide text-faint">ou</span>
        <span className="h-px flex-1 bg-hair" />
      </div>

      <div className="card">
        <h2 className="font-display text-base font-semibold text-ink">Já tem um código?</h2>
        <p className="mb-3 mt-0.5 text-sm text-muted">Cola o código que te mandaram e entra na dupla.</p>
        <form onSubmit={onJoin} className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
              <IconKey />
            </span>
            <input
              type="text"
              required
              placeholder="VITA-0000"
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              className="input pl-9 font-display uppercase tracking-[0.18em]"
            />
          </div>
          <button type="submit" disabled={joining} className="btn-primary whitespace-nowrap">
            {joining ? 'Entrando...' : 'Entrar na dupla'}
          </button>
        </form>
      </div>

      <RelationCard pair={pair} onChange={onChangeType} />
    </>
  )
}

/* ---------- copiar link do convite ---------- */

function CopyLinkButton({ code }: { code: string }) {
  const [done, setDone] = useState(false)
  async function copy() {
    if (!code) return
    const link = `${window.location.origin}/convite/${code}`
    await navigator.clipboard.writeText(link)
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="mt-3 inline-flex items-center gap-1.5 text-sm font-extrabold text-rival-ink transition hover:underline"
    >
      {done ? <IconCheck /> : <IconLinkShare />}
      {done ? 'Link copiado' : 'Copiar link do convite'}
    </button>
  )
}

function IconLinkShare() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M3.9 12a3.1 3.1 0 0 1 3.1-3.1h4V7H7a5 5 0 0 0 0 10h4v-1.9H7A3.1 3.1 0 0 1 3.9 12zM8 13h8v-2H8v2zm9-6h-4v1.9h4a3.1 3.1 0 0 1 0 6.2h-4V17h4a5 5 0 0 0 0-10z" />
    </svg>
  )
}

/* ---------- tipo de relação (compartilhado) ---------- */

function RelationCard({ pair, onChange }: { pair: Pair | null; onChange: (t: RelationshipType) => void }) {
  return (
    <div className="card">
      <label className="label">Tipo de relação</label>
      <p className="mb-3 text-xs text-muted">Casal, dupla de treino, amigos... é só pra deixar com a cara de vocês.</p>
      <Select
        value={pair?.relationshipType ?? 'PAIR'}
        onChange={onChange}
        options={relationshipOptions}
      />
    </div>
  )
}

/* ---------- helpers ---------- */

function initial(name?: string | null): string {
  return (name ?? '').trim().charAt(0).toUpperCase() || '?'
}

function firstName(name?: string | null): string {
  return (name ?? '').trim().split(/\s+/)[0] || '—'
}

/* ---------- ícones SVG preenchidos ---------- */

function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
    </svg>
  )
}

function IconLink() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M3.9 12a3.1 3.1 0 0 1 3.1-3.1h4V7H7a5 5 0 0 0 0 10h4v-1.9H7A3.1 3.1 0 0 1 3.9 12zM8 13h8v-2H8v2zm9-6h-4v1.9h4a3.1 3.1 0 0 1 0 6.2h-4V17h4a5 5 0 0 0 0-10z" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  )
}

function IconQuestion() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
      <path d="M11.07 12.85c.77-1.39 2.25-2.21 3.11-3.44.91-1.29.4-3.7-2.18-3.7-1.69 0-2.52 1.28-2.87 2.34L6.54 6.96C7.25 4.83 9.18 3 11.99 3c2.35 0 3.96 1.07 4.78 2.41.7 1.15 1.11 3.3.03 4.9-1.2 1.77-2.35 2.31-2.97 3.45-.25.46-.35.76-.35 2.24h-2.89c0-.78-.12-2.05.48-3.15zM14 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
    </svg>
  )
}

function IconKey() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M12.65 10A6 6 0 1 0 7 14a5.94 5.94 0 0 0 1.65-.24L11 16l2 2 2-2 2 2 3-3-7.35-5zM7 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
    </svg>
  )
}

function IconAlert() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </svg>
  )
}
