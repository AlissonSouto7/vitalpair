import { useTranslation } from 'react-i18next'

import { useTheme } from '@/hooks/useTheme'

/**
 * O botão que troca claro e escuro.
 *
 * Vivia dentro do `chrome.tsx` da landing, então só quem não tinha entrado no app conseguia
 * trocar o tema com um toque: quem já estava dentro tinha de abrir Ajustes, rolar até
 * "Aparência" e voltar. Trocar de tema é coisa que se faz pela luz do ambiente, não pela
 * seção de preferências, e o caminho de três toques fazia a pessoa desistir e usar o app
 * com o tema errado.
 *
 * Aqui em `components/ui` porque agora é usado pela landing, pelo cabeçalho do app e pelo
 * onboarding, e duplicar o desenho em três lugares é como as três versões divergem.
 */
export function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? t('common.themeToLight') : t('common.themeToDark')}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-edge text-ink transition hover:bg-track"
    >
      {theme === 'dark' ? (
        /*
          Sol de oito raios, e não o anel de quatro pontas que estava aqui: com o traço fino
          e só quatro raios, o ícone lia como um alvo, e no fundo escuro sumia. Este é o
          mesmo desenho do protótipo, com disco cheio.
        */
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 1.2a1.15 1.15 0 011.15 1.15v1.9a1.15 1.15 0 01-2.3 0v-1.9A1.15 1.15 0 0112 1.2zm0 16.6a1.15 1.15 0 011.15 1.15v1.9a1.15 1.15 0 01-2.3 0v-1.9A1.15 1.15 0 0112 17.8zM22.8 12a1.15 1.15 0 01-1.15 1.15h-1.9a1.15 1.15 0 010-2.3h1.9A1.15 1.15 0 0122.8 12zM6.2 12a1.15 1.15 0 01-1.15 1.15h-1.9a1.15 1.15 0 010-2.3h1.9A1.15 1.15 0 016.2 12zm13.24-7.44a1.15 1.15 0 010 1.63l-1.34 1.34a1.15 1.15 0 01-1.63-1.63l1.34-1.34a1.15 1.15 0 011.63 0zM7.53 16.47a1.15 1.15 0 010 1.63l-1.34 1.34a1.15 1.15 0 01-1.63-1.63l1.34-1.34a1.15 1.15 0 011.63 0zm11.91 2.97a1.15 1.15 0 01-1.63 0l-1.34-1.34a1.15 1.15 0 011.63-1.63l1.34 1.34a1.15 1.15 0 010 1.63zM7.53 7.53a1.15 1.15 0 01-1.63 0L4.56 6.19a1.15 1.15 0 011.63-1.63l1.34 1.34a1.15 1.15 0 010 1.63z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden="true">
          <path d="M20 14.5A8 8 0 119.5 4 6.5 6.5 0 0020 14.5z" />
        </svg>
      )}
    </button>
  )
}
