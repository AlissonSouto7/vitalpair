import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { premiumQueries } from '../premium/queries'

import { InvitePanel } from './InvitePanel'
import { PairFormed } from './PairFormed'
import { pairQueries } from './queries'
import { IconAlert } from './shared'

import { updateRelationshipType } from '@/api/pair'
import { useAuthStore } from '@/store/authStore'
import type { Pair, RelationshipType } from '@/types/pair'

export function PairPage() {
  const { t } = useTranslation()
  const userId = useAuthStore((s) => s.userId)
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pairQuery = useQuery(pairQueries.current())
  const pair: Pair | null = pairQuery.data ?? null

  /**
   * Children hand back the pair the server returned, which is this screen's whole state.
   *
   * Leaving a pair answers with the new solo pair rather than with nothing, so there is
   * always a pair to write: the endpoint never returns null.
   */
  function setPair(next: Pair) {
    queryClient.setQueryData(pairQueries.current().queryKey, next)
    // A pair forming or ending changes who borrows whose plan, so the AI screens have to
    // ask again rather than trust an answer given before this.
    void queryClient.invalidateQueries({ queryKey: premiumQueries.entitlement().queryKey })
  }

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

  if (pairQuery.isPending) return <p className="text-muted">{t('common.loading')}</p>
  if (pairQuery.isError)
    return (
      <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 font-semibold text-danger">
        {t('pair.loadError')}
      </p>
    )

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
          onChangeType={(type) => void changeType(type)}
          onLeft={setPair}
          t={t}
        />
      ) : (
        <InvitePanel
          pair={pair}
          me={me}
          copied={copied}
          onCopy={() => void copyCode()}
          onJoined={setPair}
          onChangeType={(type) => void changeType(type)}
          t={t}
        />
      )}
    </div>
  )
}

/* ---------- dupla formada ---------- */

/* ---------- helpers ---------- */

/* ---------- ícones SVG preenchidos ---------- */
