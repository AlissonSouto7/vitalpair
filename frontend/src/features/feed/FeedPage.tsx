import { useCallback, useEffect, useState } from 'react'
import { getFeed, reactToItem, removeReaction } from '../../api/feed'
import type { FeedItem, ReactionType } from '../../types/feed'

const REACTIONS: { type: ReactionType; emoji: string; title: string }[] = [
  { type: 'FIRE', emoji: '🔥', title: 'Motivação' },
  { type: 'EYE', emoji: '👀', title: 'Saudade' },
  { type: 'STRENGTH', emoji: '💪', title: 'Força' },
]

export function FeedPage() {
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
      .catch(() => setError('Não foi possível carregar o feed.'))
      .finally(() => setLoading(false))
  }, [load])

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
      setError('Não foi possível registrar a reação.')
    }
  }

  if (loading) return <p className="text-slate-400">Carregando...</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Feed do par</h1>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nada por aqui ainda. Registre refeições e atividades para alimentar o feed.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm">
                    <span className="font-bold text-slate-100">{item.actorName}</span>{' '}
                    <span className="text-slate-500">registrou</span>
                  </p>
                  <p className="text-sm text-slate-300">{item.title}</p>
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
                      title={r.title}
                      onClick={() => toggle(item, r.type)}
                      className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition ${
                        active
                          ? 'border-lime-400/50 bg-lime-400/10 text-lime-300'
                          : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span>{r.emoji}</span>
                      {count > 0 && <span className="font-semibold">{count}</span>}
                    </button>
                  )
                })}
                <span className="ml-auto text-xs text-slate-600">
                  {new Date(item.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!last && (
        <button onClick={() => load(page + 1).catch(() => setError('Falha ao carregar mais.'))} className="btn-ghost w-full">
          Carregar mais
        </button>
      )}
    </div>
  )
}

function Badge({ type, isPrivate }: { type: FeedItem['type']; isPrivate: boolean }) {
  const isMeal = type === 'MEAL_LOGGED'
  return (
    <div className="flex items-center gap-1">
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          isMeal ? 'bg-lime-400/15 text-lime-300' : 'bg-amber-400/15 text-amber-300'
        }`}
      >
        {isMeal ? 'Refeição' : 'Atividade'}
      </span>
      {isPrivate && <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-500">privada</span>}
    </div>
  )
}
