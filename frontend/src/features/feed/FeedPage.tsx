import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getFeed, reactToItem, removeReaction } from '../../api/feed'
import type { FeedItem, ReactionType } from '../../types/feed'

const REACTIONS: { type: ReactionType; emoji: string }[] = [
  { type: 'FIRE', emoji: '🔥' },
  { type: 'EYE', emoji: '👀' },
  { type: 'STRENGTH', emoji: '💪' },
]

export function FeedPage() {
  const { t, i18n } = useTranslation()
  const [items, setItems] = useState<FeedItem[]>([])
  const [page, setPage] = useState(0)
  const [last, setLast] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (pageToLoad: number) => {
    const result = await getFeed(pageToLoad, 20)
    setItems((prev) => (pageToLoad === 0 ? result.content : [...prev, ...result.content]))
    setPage(result.page)
    setLast(result.last)
  }, [])

  useEffect(() => {
    load(0)
      .catch(() => setError(t('feed.loadError')))
      .finally(() => setLoading(false))
  }, [load, t])

  async function toggle(item: FeedItem, type: ReactionType) {
    try {
      if (item.myReactions.includes(type)) {
        await removeReaction(item.id, type)
      } else {
        await reactToItem(item.id, type)
      }
      await load(0)
      setPage(0)
    } catch {
      setError(t('feed.reactError'))
    }
  }

  if (loading) return <p className="text-muted">{t('common.loading')}</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{t('feed.title')}</h1>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-faint">{t('feed.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm">
                    <span className="font-bold text-ink">{item.actorName}</span>{' '}
                    <span className="text-faint">{t('feed.registered')}</span>
                  </p>
                  <p className="text-sm text-ink">{item.title}</p>
                </div>
                <Badge type={item.type} isPrivate={item.isPrivate} />
              </div>

              <div className="mt-3 flex items-center gap-2">
                {REACTIONS.map((r) => {
                  const active = item.myReactions.includes(r.type)
                  const count = item.reactionCounts[r.type] ?? 0
                  return (
                    <button
                      key={r.type}
                      title={t(`feed.reaction.${r.type}`)}
                      onClick={() => toggle(item, r.type)}
                      className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition ${
                        active
                          ? 'border-lime-400/50 bg-lime-400/10 text-accent'
                          : 'border-line text-muted hover:bg-surface2'
                      }`}
                    >
                      <span>{r.emoji}</span>
                      {count > 0 && <span className="font-semibold">{count}</span>}
                    </button>
                  )
                })}
                <span className="ml-auto text-xs text-faint">
                  {new Date(item.createdAt).toLocaleString(i18n.language)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!last && (
        <button onClick={() => load(page + 1).catch(() => setError(t('feed.loadMoreError')))} className="btn-ghost w-full">
          {t('common.loadMore')}
        </button>
      )}
    </div>
  )
}

function Badge({ type, isPrivate }: { type: FeedItem['type']; isPrivate: boolean }) {
  const { t } = useTranslation()
  const isMeal = type === 'MEAL_LOGGED'
  return (
    <div className="flex items-center gap-1">
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          isMeal ? 'bg-lime-400/15 text-accent' : 'bg-amber-400/15 text-warn'
        }`}
      >
        {isMeal ? t('feed.meal') : t('feed.activity')}
      </span>
      {isPrivate && <span className="rounded-full bg-surface2 px-2 py-0.5 text-xs text-faint">{t('feed.private')}</span>}
    </div>
  )
}
