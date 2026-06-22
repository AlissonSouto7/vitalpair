import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../i18n'

export function LanguageSelect() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const current = LANGUAGES.find((l) => i18n.resolvedLanguage === l.code) ?? LANGUAGES[0]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title={current.label}
        className="flex items-center gap-1 rounded-lg border border-line px-2 py-1.5 text-sm text-muted transition hover:text-ink"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="font-semibold uppercase">{current.code}</span>
      </button>

      {open && (
        <ul className="absolute right-0 z-30 mt-1.5 w-40 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-xl shadow-black/40">
          {LANGUAGES.map((lang) => {
            const active = lang.code === current.code
            return (
              <li key={lang.code}>
                <button
                  onClick={() => {
                    i18n.changeLanguage(lang.code)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    active ? 'bg-lime-400/15 font-medium text-accent' : 'text-ink hover:bg-surface2'
                  }`}
                >
                  <span className="text-base leading-none">{lang.flag}</span>
                  {lang.label}
                  {active && <span className="ml-auto text-accent">✓</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
