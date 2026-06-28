import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../hooks/useAuth'
import { LanguageSelect } from '../../components/LanguageSelect'
import { BrandMark } from '../../components/brand/BrandMark'
import { getProfile } from '../../api/profile'
import { getNotificationPrefs, updateNotificationPrefs } from '../../api/notifications'
import type { NotificationPrefs } from '../../types/notification'

export function SettingsPage() {
  const { t } = useTranslation()
  const { theme, toggle } = useTheme()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const [email, setEmail] = useState<string | null>(null)
  const [name, setName] = useState('')

  // notificações: preferências reais (persistidas no backend)
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    notifyRival: true,
    notifyFlash: true,
    notifyReminder: false,
  })

  useEffect(() => {
    getProfile()
      .then((profile) => {
        setEmail(profile.email ?? null)
        setName(profile.name ?? '')
      })
      .catch(() => {
        // sem perfil carregado, a seção Conta mostra um fallback de boa
      })
    getNotificationPrefs()
      .then(setPrefs)
      .catch(() => {
        // mantém os defaults se não rolar carregar
      })
  }, [])

  function savePref(patch: Partial<NotificationPrefs>) {
    const next = { ...prefs, ...patch }
    setPrefs(next) // otimista
    updateNotificationPrefs(next).catch(() => {
      // se falhar, recarrega o que tá salvo de verdade
      getNotificationPrefs().then(setPrefs).catch(() => {})
    })
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const initial = (name.trim().charAt(0) || 'A').toUpperCase()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">{t('settings.title')}</h1>
          <p className="mt-1 text-sm font-semibold text-muted">{t('settings.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={isDark ? t('settings.toLightTheme') : t('settings.toDarkTheme')}
          className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-hair text-muted transition hover:text-ink"
        >
          {isDark ? <IconSun className="h-[18px] w-[18px]" /> : <IconMoon className="h-[18px] w-[18px]" />}
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
            control={<Toggle on={prefs.notifyRival} onToggle={() => savePref({ notifyRival: !prefs.notifyRival })} label={t('settings.notifyRival')} />}
            divider
          />
          <RowItem
            title={t('settings.notifyFlash')}
            hint={t('settings.notifyFlashHint')}
            control={<Toggle on={prefs.notifyFlash} onToggle={() => savePref({ notifyFlash: !prefs.notifyFlash })} label={t('settings.notifyFlash')} />}
            divider
          />
          <RowItem
            title={t('settings.notifyReminder')}
            hint={t('settings.notifyReminderHint')}
            control={<Toggle on={prefs.notifyReminder} onToggle={() => savePref({ notifyReminder: !prefs.notifyReminder })} label={t('settings.notifyReminder')} />}
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
              <div className="text-sm font-extrabold text-ink">{name || t('settings.youFallback')}</div>
              <div className="truncate text-xs font-semibold text-muted">{email ?? t('settings.loadingEmail')}</div>
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
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-[18px] py-4 text-left text-sm font-extrabold text-danger transition hover:bg-danger-soft/40"
          >
            <IconLogout className="h-[18px] w-[18px]" />
            {t('settings.logout')}
          </button>
        </div>
      </Section>

      {/* SOBRE */}
      <Section title={t('settings.about')}>
        <div className="flex items-center gap-3.5 rounded-2xl border border-hair bg-surface px-[18px] py-4">
          <BrandMark size={40} />
          <div>
            <div className="font-display text-base font-semibold text-ink">VitalPair</div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted">{t('settings.tagline')}</div>
          </div>
        </div>
      </Section>
    </div>
  )
}

/* ---------- subcomponentes ---------- */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.07em] text-muted">{title}</h2>
      {children}
    </section>
  )
}

function Row({ title, hint, control }: { title: string; hint: string; control: ReactNode }) {
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

function RowItem({
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

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
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

function IconSun({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 7a5 5 0 100 10 5 5 0 000-10zM11 1h2v3h-2zm0 19h2v3h-2zM1 11h3v2H1zm19 0h3v2h-3zM4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4zm12.1 12.1l1.4-1.4 2.1 2.1-1.4 1.4zM18.4 4.2l1.4 1.4-2.1 2.1-1.4-1.4zM6.3 16.3l1.4 1.4-2.1 2.1-1.4-1.4z" />
    </svg>
  )
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20 14.5A8 8 0 119.5 4 6.5 6.5 0 0020 14.5z" />
    </svg>
  )
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5c0-3-4-5.5-9-5.5z" />
    </svg>
  )
}

function IconLock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm0 2a3 3 0 013 3v3H9V6a3 3 0 013-3z" />
    </svg>
  )
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M10 3h6a2 2 0 012 2v14a2 2 0 01-2 2h-6v-2h6V5h-6zm-1.3 4.3l1.4 1.4L8.4 11H15v2H8.4l1.7 1.7-1.4 1.4L4.6 12z" />
    </svg>
  )
}

