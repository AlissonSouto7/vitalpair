import { useTranslation } from 'react-i18next'

/**
 * What a paid feature shows to someone who does not have the plan.
 *
 * Visible rather than hidden, by decision: the person sees what the product does and that it
 * is part of the paid plan, instead of a menu entry that quietly does not exist. Nothing
 * here calls the API; the screen decides to render this from the entitlement it read, so a
 * person without the plan never sees a refused request.
 */
export function PremiumCallout() {
  const { t } = useTranslation()
  return (
    <section
      role="status"
      className="card flex flex-col items-center gap-3 py-10 text-center"
      data-testid="premium-callout"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
          <rect
            x="5"
            y="11"
            width="14"
            height="10"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M8 11V8a4 4 0 0 1 8 0v3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="16" r="1.5" fill="currentColor" />
        </svg>
      </span>
      <h2 className="font-display text-lg font-semibold text-ink">{t('premium.title')}</h2>
      <p className="max-w-md text-sm font-semibold text-muted">{t('premium.body')}</p>
      <p className="max-w-md text-xs font-semibold text-faint">{t('premium.soon')}</p>
    </section>
  )
}
