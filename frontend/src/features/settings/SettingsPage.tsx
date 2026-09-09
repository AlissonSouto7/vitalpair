import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import { updateNotificationPrefs } from '../../api/notifications'
import { BrandMark } from '../../components/brand/BrandMark'
import { LanguageSelect } from '../../components/LanguageSelect'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import type { NotificationPrefs } from '../../types/notification'
import { profileQueries } from '../profile/queries'

import { CloseAccountCard } from './CloseAccountCard'
import {
  IconLock,
  IconLogout,
  IconMoon,
  IconSun,
  IconUser,
  Row,
  RowItem,
  Section,
  Toggle,
} from './parts'
import { settingsQueries } from './queries'

export function SettingsPage() {
  const { t } = useTranslation()
  const { theme, toggle } = useTheme()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const queryClient = useQueryClient()
  const profileQuery = useQuery(profileQueries.profile())
  const email: string | null = profileQuery.data?.email ?? null
  const name: string = profileQuery.data?.name ?? ''

  // A failure to load leaves the defaults on screen rather than an error: the switches are
  // still usable, and the person came here to change them.
  const prefsKey = settingsQueries.notificationPrefs().queryKey
  const prefsQuery = useQuery(settingsQueries.notificationPrefs())
  const prefs: NotificationPrefs = prefsQuery.data ?? {
    notifyRival: true,
    notifyFlash: true,
    notifyReminder: false,
  }

  const savePrefs = useMutation({
    mutationFn: updateNotificationPrefs,
    // A switch has to move the moment it is tapped, so it flips before the request goes and
    // the snapshot puts it back if the request fails. Refetching instead, as this used to,
    // left the switch in the new position until the answer came back.
    onMutate: (next: NotificationPrefs) => {
      const previous = queryClient.getQueryData<NotificationPrefs>(prefsKey)
      queryClient.setQueryData(prefsKey, next)
      return { previous }
    },
    onError: (_err, _next, context) => {
      if (context?.previous) queryClient.setQueryData(prefsKey, context.previous)
    },
  })

  function savePref(patch: Partial<NotificationPrefs>) {
    savePrefs.mutate({ ...prefs, ...patch })
  }

  async function handleLogout() {
    await logout()
    void navigate('/login')
  }

  const initial = (name.trim().charAt(0) || 'A').toUpperCase()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">
            {t('settings.title')}
          </h1>
          <p className="mt-1 text-sm font-semibold text-muted">{t('settings.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={isDark ? t('settings.toLightTheme') : t('settings.toDarkTheme')}
          className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-hair text-muted transition hover:text-ink"
        >
          {isDark ? (
            <IconSun className="h-[18px] w-[18px]" />
          ) : (
            <IconMoon className="h-[18px] w-[18px]" />
          )}
        </button>
      </header>

      {/* APARÊNCIA */}
      <Section title={t('settings.appearance')}>
        <Row
          title={t('settings.darkTheme')}
          hint={t('settings.darkThemeHint')}
          control={<Toggle on={isDark} onToggle={toggle} label={t('settings.darkTheme')} />}
        />
      </Section>

      {/* IDIOMA */}
      <Section title={t('settings.language')}>
        <Row
          title={t('settings.appLanguage')}
          hint={t('settings.appLanguageHint')}
          control={<LanguageSelect />}
        />
      </Section>

      {/* NOTIFICAÇÕES */}
      <Section title={t('settings.notifications')}>
        <div className="overflow-hidden rounded-2xl border border-hair bg-surface">
          <RowItem
            title={t('settings.notifyRival')}
            hint={t('settings.notifyRivalHint')}
            control={
              <Toggle
                on={prefs.notifyRival}
                onToggle={() => savePref({ notifyRival: !prefs.notifyRival })}
                label={t('settings.notifyRival')}
              />
            }
            divider
          />
          <RowItem
            title={t('settings.notifyFlash')}
            hint={t('settings.notifyFlashHint')}
            control={
              <Toggle
                on={prefs.notifyFlash}
                onToggle={() => savePref({ notifyFlash: !prefs.notifyFlash })}
                label={t('settings.notifyFlash')}
              />
            }
            divider
          />
          <RowItem
            title={t('settings.notifyReminder')}
            hint={t('settings.notifyReminderHint')}
            control={
              <Toggle
                on={prefs.notifyReminder}
                onToggle={() => savePref({ notifyReminder: !prefs.notifyReminder })}
                label={t('settings.notifyReminder')}
              />
            }
          />
        </div>
      </Section>

      {/* CONTA */}
      <Section title={t('settings.account')}>
        <div className="overflow-hidden rounded-2xl border border-hair bg-surface">
          <div className="flex items-center gap-3 border-b border-hair px-[18px] py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand font-display text-base font-semibold text-white">
              {initial}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-ink">
                {name || t('settings.youFallback')}
              </div>
              <div className="truncate text-xs font-semibold text-muted">
                {email ?? t('settings.loadingEmail')}
              </div>
            </div>
          </div>

          <Link
            to="/profile"
            className="flex w-full items-center gap-2.5 border-b border-hair px-[18px] py-4 text-left text-sm font-extrabold text-ink transition hover:bg-track/40"
          >
            <IconUser className="h-[18px] w-[18px] text-muted" />
            {t('settings.editProfile')}
          </Link>
          <Link
            to="/nutrition"
            className="flex w-full items-center gap-2.5 border-b border-hair px-[18px] py-4 text-left text-sm font-extrabold text-ink transition hover:bg-track/40"
          >
            <IconLock className="h-[18px] w-[18px] text-muted" />
            {t('settings.privacy')}
          </Link>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-2.5 px-[18px] py-4 text-left text-sm font-extrabold text-danger transition hover:bg-danger-soft/40"
          >
            <IconLogout className="h-[18px] w-[18px]" />
            {t('settings.logout')}
          </button>
        </div>
      </Section>

      {/* ENCERRAR CONTA */}
      <Section title={t('settings.dangerZone')}>
        <CloseAccountCard />
      </Section>

      {/* SOBRE */}
      <Section title={t('settings.about')}>
        <div className="flex items-center gap-3.5 rounded-2xl border border-hair bg-surface px-[18px] py-4">
          <BrandMark size={40} />
          <div>
            <div className="font-display text-base font-semibold text-ink">VitalPair</div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted">
              {t('settings.tagline')}
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

/* ---------- subcomponentes ---------- */
