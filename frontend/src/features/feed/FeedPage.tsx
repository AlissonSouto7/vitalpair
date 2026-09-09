import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

import { getFeed, reactToItem, removeReaction } from '../../api/feed'
import { Avatar } from '../../components/ui/Avatar'
import { useAuthStore } from '../../store/authStore'
import type { FeedItem, ReactionType } from '../../types/feed'

type TFn = (key: string, opts?: Record<string, unknown>) => string

/**
 * Reações do feed. Cada ícone é SVG preenchido (nunca emoji).
 * Cor da reação por papel: fogo = laranja (energia/você), força = roxo (par),
 * olho = neutro. A cor só "acende" quando a reação está ativa.
 */
const REACTIONS: {
  type: ReactionType
  label: string
  activeCls: string
  icon: (cls: string) => ReactElement
}[] = [
  {
    type: 'FIRE',
    label: 'FIRE',
    activeCls: 'border-brand bg-brand-soft text-brand-ink',
    icon: (cls) => (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
        <path d="M12 2c1 3-1.5 4-1.5 7A1.5 1.5 0 0012 10c.8-1.6 2.5-1.4 2.5.5 0 1-.7 1.5-.7 2.5 2-1 3-3 2.7-5.5C19 10 20 12.5 20 15a8 8 0 01-16 0c0-4 3-5.5 4-8 .8 1.6 2.5 2 4 1.5C15 7 13 4 12 2z" />
      </svg>
    ),
  },
  {
    type: 'STRENGTH',
    label: 'STRENGTH',
    activeCls: 'border-rival bg-rival-soft text-rival-ink',
    icon: (cls) => (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
        <path d="M7 11V7a2 2 0 014 0v4h1V8a2 2 0 014 0v3h1V9a2 2 0 014 0v6a6 6 0 01-6 6h-3a5 5 0 01-4-2l-4-5a1.6 1.6 0 012.3-2.2z" />
      </svg>
    ),
  },
  {
    type: 'EYE',
    label: 'EYE',
    activeCls: 'border-rival bg-rival-soft text-rival-ink',
    icon: (cls) => (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
        <path d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7zm0 3a4 4 0 110 8 4 4 0 010-8z" />
      </svg>
    ),
  },
]

export function FeedPage() {
  const { t, i18n } = useTranslation()
  const myId = useAuthStore((s) => s.userId)
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  /**
   * The pair's timeline, one page at a time.
   *
   * Accumulating the pages by hand meant a reaction had to refetch page zero and then
   * discard everything after it, so someone who had loaded four pages lost three of them
   * to a single tap. An infinite query keeps every loaded page and refreshes them all.
   */
  const feed = useInfiniteQuery({
    queryKey: ['feed', 'timeline'],
    queryFn: ({ pageParam }) => getFeed(pageParam, 20),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.page + 1),
  })

  const items: FeedItem[] = feed.data?.pages.flatMap((p) => p.content) ?? []

  async function toggle(item: FeedItem, type: ReactionType) {
    setError(null)
    try {
      if (item.myReactions.includes(type)) {
        await removeReaction(item.id, type)
      } else {
        await reactToItem(item.id, type)
      }
      await queryClient.invalidateQueries({ queryKey: ['feed'] })
    } catch {
      setError(t('feed.reactError'))
    }
  }

  if (feed.isPending) return <p className="font-bold text-muted">{t('common.loading')}</p>
  if (feed.isError)
    return (
      <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 font-semibold text-danger">
        {t('feed.loadError')}
      </p>
    )

  return (
    <div className="mx-auto max-w-[620px]">
      {/* Cabeçalho com tom de papo */}
      <header className="mb-5">
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">
          {t('feed.pageTitle')}
        </h1>
        <p className="mt-1 text-sm font-semibold text-muted">{t('feed.pageSubtitle')}</p>
      </header>

      {error && (
        <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState t={t} />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              isMine={item.userId === myId}
              locale={i18n.language}
              onToggle={(item, type) => void toggle(item, type)}
            />
          ))}
        </div>
      )}

      {feed.hasNextPage && items.length > 0 && (
        <button
          onClick={() => void feed.fetchNextPage()}
          disabled={feed.isFetchingNextPage}
          className="btn-ghost mt-4 w-full disabled:opacity-60"
        >
          {feed.isFetchingNextPage ? t('common.loading') : t('common.loadMore')}
        </button>
      )}
    </div>
  )
}

function FeedCard({
  item,
  isMine,
  locale,
  onToggle,
}: {
  item: FeedItem
  isMine: boolean
  locale: string
  onToggle: (item: FeedItem, type: ReactionType) => void
}) {
  const { t } = useTranslation()
  const isMeal = item.type === 'MEAL_LOGGED'

  return (
    <article className="card">
      <div className="flex items-start gap-3">
        <Avatar initial={initial(item.actorName)} tone={isMine ? 'you' : 'rival'} size={38} />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold leading-snug text-ink">{item.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] font-bold text-muted">
            <span className="truncate">{item.actorName}</span>
            <span aria-hidden="true">·</span>
            <span>{relativeTime(item.createdAt, locale, t)}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <TypeTag
            isMeal={isMeal}
            isPrivate={item.isPrivate}
            mealLabel={t('feed.meal')}
            activityLabel={t('feed.activity')}
            privateLabel={t('feed.private')}
          />
          {item.points > 0 && (
            <span className="rounded-lg bg-success-soft px-2 py-1 text-[11px] font-extrabold text-success-ink">
              +{item.points} pts
            </span>
          )}
        </div>
      </div>

      {item.subtitle && (
        <p className="mt-2.5 text-[12.5px] font-semibold text-muted">{item.subtitle}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {REACTIONS.map((r) => {
          const active = item.myReactions.includes(r.type)
          const count = item.reactionCounts[r.type] ?? 0
          return (
            <button
              key={r.type}
              type="button"
              aria-pressed={active}
              aria-label={t(`feed.reaction.${r.type}`)}
              title={t(`feed.reaction.${r.type}`)}
              onClick={() => onToggle(item, r.type)}
              className={`group flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition hover:-translate-y-px ${
                active ? r.activeCls : 'border-hair text-muted hover:bg-surface'
              }`}
            >
              {r.icon('h-[15px] w-[15px] fill-current')}
              <span>{count > 0 ? count : t(`feed.reactionShort.${r.type}`)}</span>
            </button>
          )
        })}
      </div>
    </article>
  )
}

function TypeTag({
  isMeal,
  isPrivate,
  mealLabel,
  activityLabel,
  privateLabel,
}: {
  isMeal: boolean
  isPrivate: boolean
  mealLabel: string
  activityLabel: string
  privateLabel: string
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <span
        className={`rounded-lg px-[10px] py-[5px] text-[11px] font-extrabold ${
          isMeal ? 'bg-success-soft text-success-ink' : 'bg-carb/15 text-carb-ink'
        }`}
      >
        {isMeal ? mealLabel : activityLabel}
      </span>
      {isPrivate && (
        <span className="inline-flex items-center gap-1 rounded-lg bg-track px-[10px] py-[5px] text-[11px] font-extrabold text-muted">
          <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden="true">
            <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm0 2a3 3 0 013 3v3H9V6a3 3 0 013-3z" />
          </svg>
          {privateLabel}
        </span>
      )}
    </div>
  )
}

function EmptyState({ t }: { t: TFn }) {
  return (
    <div className="card flex flex-col items-center gap-3 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-brand" aria-hidden="true">
          <path d="M8 7a3 3 0 116 0 3 3 0 01-6 0zm9 1.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5zM3 19c0-3 2.7-5 8-5s8 2 8 5v1H3zm16.5-1H21v-1c0-2-1-3.4-2.8-4.2 2 .6 3 2 3 4.2v1z" />
        </svg>
      </span>
      <div>
        <p className="font-display text-lg font-semibold text-ink">{t('feed.emptyTitle')}</p>
        <p className="mt-1 text-sm font-semibold text-muted">{t('feed.emptyText')}</p>
      </div>
    </div>
  )
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || 'A'
}

/** Tempo relativo no tom de papo ("agora", "há 20 min", "há 2h", "ontem"). */
function relativeTime(iso: string, locale: string, t: TFn): string {
  const then = new Date(iso).getTime()
  const diffMin = Math.round((Date.now() - then) / 60000)
  if (diffMin < 1) return t('feed.now')
  if (diffMin < 60) return t('feed.minAgo', { n: diffMin })
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return t('feed.hourAgo', { n: diffH })
  const diffD = Math.round(diffH / 24)
  if (diffD === 1) return t('feed.yesterday')
  if (diffD < 7) return t('feed.daysAgo', { n: diffD })
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short' })
}
