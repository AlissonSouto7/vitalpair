import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PainelCalorias, PainelMacros, PainelPeso, Tabs, WindowPicker, type Tab } from './parts'

import { getProgress } from '@/api/progress'
import type { ProgressDays } from '@/types/progress'

/**
 * Progresso, peso, calorias e macros ao longo do tempo (dados reais).
 * Lei das cores: laranja = você/peso/proteína, dourado = carbo, verde = saúde/dentro da meta.
 */

export function ProgressPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('peso')
  /*
    A janela fazia parte do servidor e eram sempre sete dias, que responde "como foi minha
    semana" e mais nada: quem estava seis semanas dentro de uma mudança não tinha como ver a
    mudança. Sete continua o padrão, então a tela abre no que sempre mostrou.
  */
  const [days, setDays] = useState<ProgressDays>(7)
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['progress', days],
    queryFn: () => getProgress(days),
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

      <WindowPicker days={days} onChange={setDays} />

      {tab === 'peso' && (
        <PainelPeso weights={data.weights} onLogged={() => refetch().then(() => undefined)} />
      )}
      {tab === 'calorias' && (
        <PainelCalorias
          calories={data.calories}
          targetKcal={data.targetKcal}
          byWeek={days === 90}
        />
      )}
      {tab === 'macros' && <PainelMacros macros={data.macros} />}
    </div>
  )
}
