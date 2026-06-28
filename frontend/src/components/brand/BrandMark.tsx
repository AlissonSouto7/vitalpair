import { Broto } from './Broto'

/**
 * Marca VitalPair: o mascote Broto. Sozinho (BrandMark) usa o seu Broto (laranja);
 * o lockup usa os dois Brotos (você + Célia) + a palavra VitalPair + slogan.
 */
export function BrandMark({ size = 40 }: { size?: number }) {
  return <Broto who="you" expr="happy" level={6} size={size} />
}

export function BrandLockup({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex shrink-0 items-end">
        <Broto who="you" expr="happy" level={6} size={size} />
        <div style={{ marginLeft: -size * 0.34 }}>
          <Broto who="partner" expr="happy" level={6} size={size} />
        </div>
      </div>
      <div className="leading-none">
        <div className="font-display text-[20px] font-semibold tracking-tight text-ink">VitalPair</div>
        <div className="mt-[3px] text-[9px] font-extrabold uppercase tracking-[0.05em] text-muted">
          Saúde é melhor em dupla
        </div>
      </div>
    </div>
  )
}
