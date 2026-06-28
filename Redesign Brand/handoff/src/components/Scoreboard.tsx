import { Avatar } from './Avatar';

/**
 * Placar da temporada — a assinatura visual do produto.
 * Você (laranja) vs. par (roxo); a barra é cabo-de-guerra; quem lidera = verde.
 * O fundo (bg-arena) é theme-aware: claro no modo claro, espresso no escuro.
 *
 * Para o modo SOLO, passe rival={{ name:'Semana passada', score, tone:'ghost' }}
 * e o lado direito vira cinza-fantasma (sem roxo, que é reservado ao par real).
 */
interface Side {
  name: string;
  score: number;
  initial?: string;
  tone?: 'you' | 'rival' | 'ghost';
}

export function Scoreboard({
  you,
  rival,
  stake,
  day = 12,
  total = 30,
}: {
  you: Side;
  rival: Side;
  stake?: string;
  day?: number;
  total?: number;
}) {
  const youPct = Math.round((you.score / (you.score + rival.score)) * 100);
  const leading = you.score - rival.score;
  const ghost = rival.tone === 'ghost';

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-arena-border bg-arena p-[24px_28px] shadow-[0_14px_36px_var(--arena-shadow,rgba(70,45,20,.1))]">
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{
          background: `linear-gradient(90deg, var(--brand) 0 ${youPct}%, ${
            ghost ? '#9a8f7f' : 'var(--rival)'
          } ${youPct}% 100%)`,
        }}
      />
      <div className="mb-[18px] flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-arena-muted">
          Temporada 01 · dia {day} / {total}
        </div>
        {stake && (
          <div className="flex items-center gap-2 rounded-lg border border-arena-line bg-white/[0.06] px-3 py-[5px]">
            <span className="text-[10px] font-extrabold tracking-[0.1em] text-arena-muted">EM JOGO</span>
            <span className="text-xs font-extrabold text-arena-text">{stake}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-5">
        <div className="flex flex-1 items-center gap-[14px]">
          <Avatar initial={you.initial ?? 'A'} tone="you" size={56} />
          <div>
            <div className="text-xs font-extrabold tracking-wide text-brand-ink">{you.name}</div>
            <div className="font-display text-[44px] font-semibold leading-[.95] text-arena-text">{you.score}</div>
          </div>
        </div>
        <div className="font-display text-base font-semibold text-arena-muted">vs</div>
        <div className="flex flex-1 items-center justify-end gap-[14px] text-right">
          <div>
            <div className={`text-xs font-extrabold tracking-wide ${ghost ? 'text-arena-muted' : 'text-rival-ink'}`}>
              {rival.name}
            </div>
            <div className={`font-display text-[44px] font-semibold leading-[.95] ${ghost ? 'text-arena-muted' : 'text-arena-text'}`}>
              {rival.score}
            </div>
          </div>
          <Avatar initial={rival.initial ?? 'A'} tone={rival.tone ?? 'rival'} size={56} />
        </div>
      </div>

      <div className="my-[18px] flex h-[9px] overflow-hidden rounded-md bg-arena-track">
        <div className="bg-brand" style={{ width: `${youPct}%` }} />
        <div className="flex-1" style={{ background: ghost ? '#9a8f7f' : 'var(--rival)' }} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[13px] font-extrabold text-success-ink">
          {leading >= 0 ? `Você lidera por ${leading} pts` : `Você tá ${-leading} atrás — corre`}
        </span>
        <span className="text-xs font-bold text-arena-muted">faltam {total - day} dias</span>
      </div>
    </div>
  );
}
