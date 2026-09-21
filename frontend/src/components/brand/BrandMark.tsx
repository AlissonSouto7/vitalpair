import { useTranslation } from 'react-i18next'

import { Broto } from './Broto'

/**
 * Marca VitalPair: o mascote Broto. Sozinho (BrandMark) usa o seu Broto (laranja);
 * o lockup usa os dois Brotos (você + o par) + a palavra VitalPair + slogan.
 *
 * Sem `mascot` de propósito: aqui o Broto é o logotipo do produto, não o bicho da pessoa.
 * A escolha feita no perfil muda o bicho dela nas telas que são dela; o logotipo é o mesmo
 * para todo mundo, como qualquer marca.
 */
export function BrandMark({ size = 40 }: { size?: number }) {
  return <Broto who="you" expr="happy" level={6} size={size} />
}

export function BrandLockup({ size = 40 }: { size?: number }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex shrink-0 items-end">
        <Broto who="you" expr="happy" level={6} size={size} />
        <div style={{ marginLeft: -size * 0.34 }}>
          <Broto who="partner" expr="happy" level={6} size={size} />
        </div>
      </div>
      <div className="leading-none">
        <div className="font-display text-[20px] font-semibold tracking-tight text-ink">
          VitalPair
        </div>
        <div className="mt-[3px] text-[9px] font-extrabold uppercase tracking-[0.05em] text-muted">
          {t('common.brandTagline')}
        </div>
      </div>
    </div>
  )
}
