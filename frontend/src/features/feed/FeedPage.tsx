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
    const has = item.myReactions.includes(type)
    try {
      if (has) {
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

  if (loading) return <p className="text-slate-500">Carregando...</p>

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">Feed do par</h1>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-slate-400">
          Nada por aqui ainda. Registre refeições e atividades para alimentar o feed.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    <span className="font-semibold text-slate-800">{item.actorName}</span>{' '}
                    <span className="text-slate-500">registrou</span>
                  </p>
                  <p className="text-sm text-slate-700">{item.title}</p>
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
                          ? 'border-blue-300 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span>{r.emoji}</span>
                      {count > 0 && <span className="font-medium">{count}</span>}
                    </button>
                  )
                })}
                <span className="ml-auto text-xs text-slate-400">
                  {new Date(item.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!last && (
        <button
          onClick={() => load(page + 1).catch(() => setError('Falha ao carregar mais.'))}
          className="w-full rounded-lg border border-slate-300 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
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
          isMeal ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}
      >
        {isMeal ? 'Refeição' : 'Atividade'}
      </span>
      {isPrivate && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">privada</span>
      )}
    </div>
  )
}
