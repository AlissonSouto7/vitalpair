import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { refreshSession } from '@/api/auth'
import { getPair, joinPair, leavePair, updateRelationshipType } from '@/api/pair'
import { BrandMark } from '@/components/brand/BrandMark'
import { Avatar } from '@/components/ui/Avatar'
import { Select } from '@/components/ui/Select'
import { getApiErrorMessage } from '@/shared/api/errors'
import { Field } from '@/shared/ui/form/Field'
import { FormError } from '@/shared/ui/form/FormError'
import { useAuthStore } from '@/store/authStore'
import type { Pair, PairMember, RelationshipType } from '@/types/pair'

type TFn = (key: string, opts?: Record<string, unknown>) => string

const RELATIONSHIP_VALUES: RelationshipType[] = [
  'PAIR',
  'DUO',
  'FRIENDS',
  'CONFIDANTS',
  'BROTHERS',
  'OTHER',
]

/**
 * Mirrors how AuthService generates a code: eight characters from an alphabet without
 * I, O, 0 and 1, the ones people misread. Trimmed and uppercased first, so a code pasted
 * with a space or typed in lowercase still matches, and a blank never reaches the server.
 */
const INVITE_CODE = /^[A-HJ-NP-Z2-9]{8}$/

const joinSchema = z.object({
  code: z.string().trim().toUpperCase().regex(INVITE_CODE),
})

type JoinValues = z.infer<typeof joinSchema>

export function PairPage() {
  const { t } = useTranslation()
  const userId = useAuthStore((s) => s.userId)
  const [pair, setPair] = useState<Pair | null>(null)
  const [loading, setLoading] = useState(true)
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

  if (loading) return <p className="text-muted">{t('common.loading')}</p>

  const isActive = pair?.status === 'ACTIVE'
  const me = pair?.members.find((m) => m.userId === userId) ?? null
  const partner = pair?.members.find((m) => m.userId !== userId) ?? null

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {isActive ? t('pair.titleActive') : t('pair.titleInvite')}
        </h1>
        <p className="text-sm text-muted">
          {isActive ? t('pair.subtitleActive') : t('pair.subtitleInvite')}
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger"
        >
          <IconAlert />
          {error}
        </p>
      )}

      {isActive && pair ? (
        <PairFormed
          pair={pair}
          me={me}
          partner={partner}
          onChangeType={changeType}
          onLeft={setPair}
          t={t}
        />
      ) : (
        <InvitePanel
          pair={pair}
          me={me}
          copied={copied}
          onCopy={copyCode}
          onJoined={setPair}
          onChangeType={changeType}
          t={t}
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
  onLeft,
  t,
}: {
  pair: Pair
  me: PairMember | null
  partner: PairMember | null
  onChangeType: (type: RelationshipType) => void
  onLeft: (pair: Pair) => void
  t: TFn
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
          {t('pair.pairFormed')}
        </p>
        <h2 className="mt-3 font-display text-xl font-semibold text-ink">
          {pair.pairName ?? `${firstName(me?.name)} & ${firstName(partner?.name)}`}
        </h2>
        <p className="mt-1 text-sm text-muted">{t('pair.pairStarted')}</p>
      </div>

      <div className="space-y-3">
        <MemberRow member={me} tone="you" tag={t('pair.tagYou')} />
        <MemberRow member={partner} tone="rival" tag={t('pair.tagPartner')} />
      </div>

      <RelationCard pair={pair} onChange={onChangeType} t={t} />

      <LeavePairCard partnerName={firstName(partner?.name)} onLeft={onLeft} t={t} />
    </>
  )
}

/**
 * Ending the pair.
 *
 * <p>Two steps rather than one, and the second is not a browser confirm(): this ends a
 * competition between two people, and the person deserves to read what happens to what they
 * built before the button they press does it. Destructive, so red, and never the first
 * thing the eye lands on: it sits at the bottom, below everything the pair is for.
 */
function LeavePairCard({
  partnerName,
  onLeft,
  t,
}: {
  partnerName: string
  onLeft: (pair: Pair) => void
  t: TFn
}) {
  const [confirming, setConfirming] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setLeaving(true)
    setError(null)
    try {
      const fresh = await leavePair()
      // The tenant changed, so the access token's claims are stale. Without this the next
      // request is scoped to a pair this person no longer belongs to.
      await refreshSession()
      onLeft(fresh)
    } catch (err) {
      setError(getApiErrorMessage(err, t('pair.leaveError')))
      setLeaving(false)
    }
  }

  if (!confirming) {
    return (
      <div className="card flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-ink">{t('pair.leave')}</p>
          <p className="mt-0.5 text-xs font-semibold text-muted">{t('pair.leaveHint')}</p>
        </div>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="shrink-0 rounded-xl border border-danger/40 px-3.5 py-2 text-[13px] font-extrabold text-danger transition hover:bg-danger-soft"
        >
          {t('pair.leave')}
        </button>
      </div>
    )
  }

  return (
    <div className="card border-danger/30 bg-danger-soft/40">
      <h2 className="font-display text-base font-semibold text-ink">
        {t('pair.leaveConfirmTitle', { name: partnerName })}
      </h2>
      <p className="mt-1.5 text-sm font-semibold leading-relaxed text-muted">
        {t('pair.leaveConfirmText')}
      </p>

      <FormError message={error} />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={leaving}
          className="rounded-xl bg-danger px-4 py-2.5 text-sm font-extrabold text-white transition hover:brightness-105 disabled:opacity-60"
        >
          {leaving ? t('pair.leaving') : t('pair.leaveConfirm')}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false)
            setError(null)
          }}
          disabled={leaving}
          className="rounded-xl border border-hair bg-surface px-4 py-2.5 text-sm font-extrabold text-ink transition hover:border-brand disabled:opacity-60"
        >
          {t('pair.leaveCancel')}
        </button>
      </div>
    </div>
  )
}

function MemberRow({
  member,
  tone,
  tag,
}: {
  member: PairMember | null
  tone: 'you' | 'rival'
  tag: string
}) {
  const tagCls = tone === 'you' ? 'bg-brand-soft text-brand-ink' : 'bg-rival-soft text-rival-ink'
  return (
    <div className="card flex items-center gap-3 py-3.5">
      <Avatar
        initial={initial(member?.name)}
        tone={tone}
        size={44}
        art={member?.avatarUrl ?? undefined}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{member?.name ?? '—'}</p>
        <p className="truncate text-xs text-faint">{member?.email ?? ''}</p>
      </div>
      <span
        className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${tagCls}`}
      >
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
  onJoined,
  onChangeType,
  t,
}: {
  pair: Pair | null
  me: PairMember | null
  copied: boolean
  onCopy: () => void
  onJoined: (pair: Pair) => void
  onChangeType: (type: RelationshipType) => void
  t: TFn
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

        <h2 className="font-display text-lg font-semibold text-ink">{t('pair.sendCode')}</h2>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted">{t('pair.sendCodeHint')}</p>

        <div className="mt-5 flex items-center justify-between gap-2 rounded-2xl border-[1.5px] border-dashed border-rival bg-rival-soft px-4 py-3.5">
          <span className="font-display text-2xl font-semibold tracking-[0.22em] text-rival-ink">
            {pair?.inviteCode ?? '----'}
          </span>
          <button
            type="button"
            onClick={onCopy}
            aria-label={t('pair.copyCode')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-extrabold transition ${
              copied ? 'bg-success text-white' : 'bg-rival text-white hover:brightness-105'
            }`}
          >
            {copied ? <IconCheck /> : <IconCopy />}
            {copied ? t('pair.copied') : t('pair.copy')}
          </button>
        </div>

        <CopyLinkButton code={pair?.inviteCode ?? ''} t={t} />
      </div>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-hair" />
        <span className="text-[11px] font-bold uppercase tracking-wide text-faint">
          {t('common.or')}
        </span>
        <span className="h-px flex-1 bg-hair" />
      </div>

      <div className="card">
        <h2 className="font-display text-base font-semibold text-ink">{t('pair.haveCodeTitle')}</h2>
        <p className="mb-3 mt-0.5 text-sm text-muted">{t('pair.haveCodeHint')}</p>
        <JoinForm onJoined={onJoined} t={t} />
      </div>

      <RelationCard pair={pair} onChange={onChangeType} t={t} />
    </>
  )
}

/* ---------- entrar com o código ---------- */

function JoinForm({ onJoined, t }: { onJoined: (pair: Pair) => void; t: TFn }) {
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JoinValues>({
    resolver: zodResolver(joinSchema),
    mode: 'onTouched',
  })

  async function onSubmit({ code }: JoinValues) {
    setError(null)
    try {
      const updated = await joinPair(code)
      await refreshSession()
      reset()
      onJoined(updated)
    } catch (err) {
      setError(getApiErrorMessage(err, t('pair.joinError')))
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
      className="space-y-2.5"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
            <IconKey />
          </span>
          <input
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            // The heading above the form is this field's name. A placeholder is not a label:
            // it disappears the moment someone types, and may never be announced at all.
            aria-label={t('pair.haveCodeTitle')}
            aria-invalid={errors.code ? true : undefined}
            placeholder={t('pair.codePlaceholder')}
            className="input pl-9 font-display uppercase tracking-[0.18em]"
            {...register('code')}
          />
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary whitespace-nowrap">
          {isSubmitting ? t('pair.joining') : t('pair.joinPair')}
        </button>
      </div>
      {errors.code && (
        <p role="alert" className="text-xs font-semibold text-danger">
          {t('pair.codeInvalid')}
        </p>
      )}
      <FormError message={error} />
    </form>
  )
}

/* ---------- copiar link do convite ---------- */

function CopyLinkButton({ code, t }: { code: string; t: TFn }) {
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
      {done ? t('pair.linkCopied') : t('pair.copyLink')}
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

function RelationCard({
  pair,
  onChange,
  t,
}: {
  pair: Pair | null
  onChange: (type: RelationshipType) => void
  t: TFn
}) {
  const relationshipOptions = RELATIONSHIP_VALUES.map((v) => ({
    value: v,
    label: t(`pair.rel.${v}`),
  }))
  return (
    <div className="card">
      <Field label={t('pair.relType')} hint={t('pair.relTypeHint')}>
        {(field) => (
          <Select
            {...field}
            value={pair?.relationshipType ?? 'PAIR'}
            onChange={onChange}
            options={relationshipOptions}
          />
        )}
      </Field>
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
