import { useState } from 'react'

import { firstName, initial, type TFn } from './pairText'
import { IconCheck, IconLink, RelationCard } from './shared'

import { refreshSession } from '@/api/auth'
import { leavePair } from '@/api/pair'
import { BrandMark } from '@/components/brand/BrandMark'
import { Avatar } from '@/components/ui/Avatar'
import { getApiErrorMessage } from '@/shared/api/errors'
import { FormError } from '@/shared/ui/form/FormError'
import type { Pair, PairMember, RelationshipType } from '@/types/pair'

/**
 * What the screen shows once two people are paired.
 *
 * Moved out of PairPage verbatim, markup untouched. Leaving a pair lives here rather than in
 * the page because it is only reachable from this half, and it is the one action on the
 * screen that cannot be undone.
 */

export function PairFormed({
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
