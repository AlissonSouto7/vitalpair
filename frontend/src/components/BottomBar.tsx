import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

/**
 * A barra de baixo no celular, com o "+" no meio.
 *
 * O que havia aqui era uma tira horizontal com os doze itens do menu, rolável, colada abaixo do
 * cabeçalho. Ou seja: a ação que a pessoa faz várias vezes por dia, registrar o que comeu,
 * estava atrás de encontrar um item entre doze que não cabiam na tela, num lugar onde o polegar
 * nem alcança. Doze destinos com o mesmo peso não são navegação, são uma lista.
 *
 * Quatro destinos e uma ação. Os quatro são as telas de consulta que se abrem sozinhas; a ação
 * fica no meio, maior e na laranja de ação, porque não é um lugar para ir, é a coisa a fazer.
 * O resto do menu continua inteiro na gaveta do desktop e na lateral, que é onde uma lista de
 * doze itens funciona.
 *
 * Só no celular (`md:hidden`): no desktop a lateral já mostra tudo, sempre visível, e uma barra
 * embaixo seria uma segunda navegação competindo com ela.
 */

const ICONS: Record<string, ReactNode> = {
  home: <path d="M12 3 3 10v10a1 1 0 0 0 1 1h5v-6h6v6h5a1 1 0 0 0 1-1V10z" />,
  chart: <path d="M3 3h2v18H3zm4 10h3v8H7zm5-6h3v14h-3zm5 3h3v11h-3z" />,
  heart: <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />,
  user: <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4 0-8 2-8 5v3h16v-3c0-3-4-5-8-5z" />,
}

/** Dois de cada lado do "+", na ordem em que se usa. */
const LEFT = [
  { to: '/dashboard', label: 'nav.dashboard', icon: 'home' },
  { to: '/progress', label: 'nav.progress', icon: 'chart' },
] as const

const RIGHT = [
  { to: '/feed', label: 'nav.feed', icon: 'heart' },
  { to: '/profile', label: 'nav.profile', icon: 'user' },
] as const

function Item({ to, label, icon }: { to: string; label: string; icon: string }) {
  const { t } = useTranslation()
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[10.5px] font-extrabold transition ${
          isActive ? 'text-act-ink' : 'text-muted'
        }`
      }
    >
      <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" aria-hidden="true">
        {ICONS[icon]}
      </svg>
      {t(label as 'nav.dashboard')}
    </NavLink>
  )
}

export function BottomBar() {
  const { t } = useTranslation()

  return (
    <nav
      aria-label={t('nav.bottomBarLabel')}
      /*
       * `pb-[env(safe-area-inset-bottom)]`: no iPhone a faixa do gesto de casa fica por cima dos
       * últimos pixels da tela, e sem isso o "+" cai justamente embaixo dela. Foi o mesmo
       * problema que deixou o botão de salvar do editor fora do alcance.
       */
      className="sticky bottom-0 z-20 flex items-stretch gap-1 border-t border-hair bg-sidebar/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur md:hidden"
    >
      {LEFT.map((item) => (
        <Item key={item.to} {...item} />
      ))}

      {/*
        O "+" leva direto para a busca de comida, não para um menu de opções.

        Registrar comida é o que a pessoa faz várias vezes por dia; treino e peso, uma. Uma folha
        de opções no meio cobraria um toque a mais de todo mundo para dar acesso rápido a quem
        registra uma vez. A aba já vem escolhida na consulta da rota, então a tela abre pronta
        para digitar em vez de abrir na aba da foto, que é paga.
      */}
      <NavLink
        to="/nutrition?tab=buscar"
        aria-label={t('nav.logMealAction')}
        className="mx-1 flex min-h-[52px] w-[60px] shrink-0 -translate-y-2 flex-col items-center justify-center rounded-2xl bg-act text-on-fill shadow-lg shadow-act/30 transition active:brightness-95"
      >
        <svg viewBox="0 0 24 24" width={26} height={26} fill="currentColor" aria-hidden="true">
          <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
        </svg>
      </NavLink>

      {RIGHT.map((item) => (
        <Item key={item.to} {...item} />
      ))}
    </nav>
  )
}
