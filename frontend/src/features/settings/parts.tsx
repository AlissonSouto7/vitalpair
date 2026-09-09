/**
 * The rows and switches the settings screen is built from.
 *
 * Moved out of SettingsPage verbatim, markup untouched.
 */

import type { ReactNode } from 'react'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.07em] text-muted">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function Row({ title, hint, control }: { title: string; hint: string; control: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-hair bg-surface px-[18px] py-4">
      <div className="min-w-0 pr-3">
        <div className="text-sm font-extrabold text-ink">{title}</div>
        <div className="text-xs font-semibold text-muted">{hint}</div>
      </div>
      {control}
    </div>
  )
}

export function RowItem({
  title,
  hint,
  control,
  divider,
}: {
  title: string
  hint: string
  control: ReactNode
  divider?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between px-[18px] py-4 ${divider ? 'border-b border-hair' : ''}`}
    >
      <div className="min-w-0 pr-3">
        <div className="text-sm font-extrabold text-ink">{title}</div>
        <div className="text-xs font-semibold text-muted">{hint}</div>
      </div>
      {control}
    </div>
  )
}

export function Toggle({
  on,
  onToggle,
  label,
}: {
  on: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={`relative h-[27px] w-[46px] shrink-0 rounded-full transition-colors ${
        on ? 'bg-success' : 'bg-track'
      }`}
    >
      <span
        className={`absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-[left] ${
          on ? 'left-[22px]' : 'left-[3px]'
        }`}
      />
    </button>
  )
}

/* ---------- ícones SVG preenchidos ---------- */

export function IconSun({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 7a5 5 0 100 10 5 5 0 000-10zM11 1h2v3h-2zm0 19h2v3h-2zM1 11h3v2H1zm19 0h3v2h-3zM4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4zm12.1 12.1l1.4-1.4 2.1 2.1-1.4 1.4zM18.4 4.2l1.4 1.4-2.1 2.1-1.4-1.4zM6.3 16.3l1.4 1.4-2.1 2.1-1.4-1.4z" />
    </svg>
  )
}

export function IconMoon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20 14.5A8 8 0 119.5 4 6.5 6.5 0 0020 14.5z" />
    </svg>
  )
}

export function IconUser({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5c0-3-4-5.5-9-5.5z" />
    </svg>
  )
}

export function IconLock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm0 2a3 3 0 013 3v3H9V6a3 3 0 013-3z" />
    </svg>
  )
}

export function IconLogout({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M10 3h6a2 2 0 012 2v14a2 2 0 01-2 2h-6v-2h6V5h-6zm-1.3 4.3l1.4 1.4L8.4 11H15v2H8.4l1.7 1.7-1.4 1.4L4.6 12z" />
    </svg>
  )
}
