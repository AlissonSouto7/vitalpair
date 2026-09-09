import type { TFunction } from 'i18next'
import { useMemo } from 'react'

type TFn = TFunction

/** What the browser thinks the zone is, or null when it will not say. */
function detectZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null
  } catch {
    return null
  }
}

/**
 * The zone the person's day is measured in.
 *
 * <p>A list of every IANA zone would be four hundred rows to scroll for a value the browser
 * already knows, so this shows what is stored and offers the detected one when the two differ.
 * Detection is a suggestion, never applied on its own: someone travelling for a week should not
 * have their streak silently recut around a different midnight.
 */
export function TimeZoneField({
  value,
  onChange,
  t,
}: {
  value: string
  onChange: (zone: string) => void
  t: TFn
}) {
  const detected = useMemo(() => detectZone(), [])
  const mismatch = detected !== null && detected !== value

  return (
    <div>
      <span className="label block">{t('profile.timeZoneLabel')}</span>
      <p className="mb-2 text-xs text-muted">{t('profile.timeZoneHint')}</p>
      <p className="font-semibold text-ink">{value}</p>
      {/*
        Gold rather than red: a zone that differs from the device is worth noticing, not an
        error. The person may well be travelling and want their account left where it is.
      */}
      {mismatch && (
        <div className="mt-2 rounded-xl border border-carb/30 bg-track px-3 py-2">
          <p className="text-xs font-semibold text-carb-ink">
            {t('profile.timeZoneMismatch', { detected, current: value })}
          </p>
          <button
            type="button"
            onClick={() => onChange(detected)}
            className="mt-1.5 text-xs font-extrabold text-brand-ink underline"
          >
            {t('profile.timeZoneUse', { detected })}
          </button>
        </div>
      )}
    </div>
  )
}
