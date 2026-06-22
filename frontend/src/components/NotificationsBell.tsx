import { useEffect, useRef, useState } from 'react'
import { listNotifications, markNotificationsRead } from '../api/notifications'
import type { NotificationFeed, NotificationType } from '../types/notification'

const DOT: Record<NotificationType, string> = {
  PARTNER_MEAL: 'bg-lime-400',
  PARTNER_ACTIVITY: 'bg-amber-400',
  PAIR_FORMED: 'bg-cyan-400',
}

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h`
  return `${Math.floor(hours / 24)} d`
}

export function NotificationsBell() {
  const [feed, setFeed] = useState<NotificationFeed>({ unreadCount: 0, items: [] })
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  async function load() {
    try {
      setFeed(await listNotifications())
    } catch {
      /* silencioso: o sino não deve quebrar o header */
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next && feed.unreadCount > 0) {
      setFeed((f) => ({ ...f, unreadCount: 0 }))
      try {
        await markNotificationsRead()
      } catch {
        /* mantém o estado otimista */
      }
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        title="Notificações"
        className="relative rounded-lg border border-line px-2 py-1.5 text-muted transition hover:text-ink"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
          />
        </svg>
        {feed.unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {feed.unreadCount > 9 ? '9+' : feed.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-xl shadow-black/40">
          <div className="border-b border-line px-4 py-2.5 text-sm font-semibold">Notificações</div>
          {feed.items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">Nada por aqui ainda.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-line overflow-auto">
              {feed.items.map((n) => (
                <li key={n.id} className={`flex gap-3 px-4 py-3 ${n.read ? '' : 'bg-surface2/60'}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[n.type]}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-sm text-muted">{n.body}</p>
                    <p className="mt-0.5 text-xs text-faint">{timeAgo(n.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
