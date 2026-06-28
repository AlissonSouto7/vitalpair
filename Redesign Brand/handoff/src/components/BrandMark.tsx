/**
 * Marca VitaPair: dois anéis entrelaçados — laranja (você) + roxo (Ana),
 * interseção verde (a saúde que constroem juntos). Ecoa o anel de calorias.
 * Usa as cores do tema (currentColor via tokens), então acompanha claro/escuro.
 */
export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 40 28"
      width={size}
      height={(size * 28) / 40}
      role="img"
      aria-label="VitaPair"
      style={{ flexShrink: 0 }}
    >
      <path d="M20 7 Q23 14 20 21 Q17 14 20 7 Z" className="fill-success" />
      <circle cx="15" cy="14" r="8.6" fill="none" strokeWidth="4.4" className="stroke-brand" />
      <circle cx="25" cy="14" r="8.6" fill="none" strokeWidth="4.4" className="stroke-rival" />
    </svg>
  );
}

export function BrandLockup({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-[11px]">
      <BrandMark size={size} />
      <div>
        <div className="font-display text-[20px] font-semibold leading-none tracking-tight text-ink">
          VitaPair
        </div>
        <div className="mt-[3px] text-[9px] font-extrabold uppercase tracking-[0.05em] text-muted">
          Saúde é melhor em dupla
        </div>
      </div>
    </div>
  );
}
