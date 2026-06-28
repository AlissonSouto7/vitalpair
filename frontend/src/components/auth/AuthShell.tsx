import type { ReactNode } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { BrandLockup } from '../brand/BrandMark'

/**
 * Layout das telas de auth: split-screen.
 * Esquerda = painel "arena" escuro (marca + headline + mini placar), some no mobile.
 * Direita = o formulário (children).
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme()

  return (
    <div className="relative flex min-h-screen bg-canvas">
      <button
        onClick={toggle}
        aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        className="absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-hair bg-surface text-muted transition hover:text-ink"
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>

      {/* Esquerda: arena */}
      <aside className="arena-panel relative hidden w-[34%] max-w-[480px] flex-col justify-between overflow-hidden px-10 py-12 lg:flex">
        <div className="[&_*]:!text-white">
          <BrandLockup size={56} />
        </div>

        <div>
          <h2 className="mb-7 max-w-[380px] font-display text-[32px] font-semibold leading-[1.15] tracking-tight text-arena-text">
            Joga com alguém. Ou contra você mesmo.
          </h2>
          <ul className="space-y-3.5">
            {[
              { c: 'bg-brand', t: 'Tira foto do prato e a IA conta as calorias' },
              { c: 'bg-success', t: 'Cada registro vira ponto no placar' },
              { c: 'bg-rival', t: 'Vacilou? O seu par passa na sua frente' },
            ].map((p) => (
              <li key={p.t} className="flex items-center gap-3 text-[14px] font-bold text-arena-text">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${p.c}`}>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white" aria-hidden="true">
                    <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                  </svg>
                </span>
                {p.t}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[12.5px] font-bold text-arena-muted">
          Não tem dupla ainda? Começa sozinho e chama alguém quando quiser.
        </p>
      </aside>

      {/* Direita: formulário */}
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-[380px]">{children}</div>
      </div>
    </div>
  )
}

