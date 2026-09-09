import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { initial, type TFn } from './pairText'
import { IconCheck, IconCopy, IconKey, IconPlus, IconQuestion, RelationCard } from './shared'

import { refreshSession } from '@/api/auth'
import { joinPair } from '@/api/pair'
import { BrandMark } from '@/components/brand/BrandMark'
import { Avatar } from '@/components/ui/Avatar'
import { getApiErrorMessage } from '@/shared/api/errors'
import { FormError } from '@/shared/ui/form/FormError'
import type { Pair, PairMember, RelationshipType } from '@/types/pair'

/**
 * The eight characters a person types or pastes.
 *
 * Ambiguous glyphs are not in the alphabet, so a code read off a screen and typed by hand
 * cannot become a different valid code. Trimmed and upper-cased first, so one pasted with a
 * space or typed in lowercase still matches, and a blank never reaches the server.
 */
const INVITE_CODE = /^[A-HJ-NP-Z2-9]{8}$/

const joinSchema = z.object({
  code: z.string().trim().toUpperCase().regex(INVITE_CODE),
})

type JoinValues = z.infer<typeof joinSchema>

/**
 * What the screen shows while the person is still alone: their code to send, or a box to
 * paste someone else's into.
 *
 * Moved out of PairPage verbatim, markup untouched.
 */

export function InvitePanel({
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
      onClick={() => void copy()}
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
