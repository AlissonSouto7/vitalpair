import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PainelCalorias, PainelMacros, PainelPeso, Tabs, type Tab } from './parts'

import { getProgress } from '@/api/progress'

/**
 * Progresso — peso, calorias e macros ao longo do tempo (dados reais).
 * Lei das cores: laranja = você/peso/proteína, dourado = carbo, verde = saúde/dentro da meta.
 */

export function ProgressPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('peso')
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['progress'],
    queryFn: getProgress,
  })

  if (isPending) return <p className="font-bold text-muted">{t('common.loading')}</p>
  if (isError || !data) {
    return (
      <p className="rounded-xl bg-danger-soft px-4 py-3 font-semibold text-danger">
        {t('progress.loadError')}
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">
          {t('progress.title')}
        </h1>
        <p className="mt-1 text-sm font-semibold text-muted">{t('progress.subtitle')}</p>
      </header>

      <Tabs tab={tab} onChange={setTab} />

      {tab === 'peso' && (
        <PainelPeso weights={data.weights} onLogged={() => refetch().then(() => undefined)} />
      )}
      {tab === 'calorias' && (
        <PainelCalorias calories={data.calories} targetKcal={data.targetKcal} />
      )}
      {tab === 'macros' && <PainelMacros macros={data.macros} />}
    </div>
  )
}
