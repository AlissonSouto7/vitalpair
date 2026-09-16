import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from './Button'

/**
 * A pergunta antes de uma ação que não volta atrás.
 *
 * Apagar uma refeição tirava o registro do dia, a linha do feed da dupla e os pontos que ela
 * rendeu, tudo com um clique e sem perguntar nada: quem errasse o alvo perdia as três coisas
 * e só descobria depois. O mesmo valia para encerrar a dupla.
 *
 * O texto não é genérico de propósito. "Tem certeza?" não informa; o que faz alguém decidir
 * é saber o que vai junto, e é por isso que `description` é obrigatória.
 *
 * O botão de confirmar não recebe foco ao abrir: quem apertou Enter para chegar aqui
 * confirmaria sem ler. O foco vai para o cancelar, que é a saída segura.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  busy = false,
}: {
  title: string
  /** O que a ação leva junto. Obrigatória: é ela que permite decidir. */
  description: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}) {
  const { t } = useTranslation()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    cancelRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        // O clique de dentro não fecha: arrastar o cursor para fora ao selecionar o texto
        // fecharia o diálogo no meio da leitura.
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[380px] rounded-xl border border-hair bg-surface p-5 shadow-[0_18px_44px_var(--arena-shadow)]"
      >
        <h2 id="confirm-title" className="font-display text-lg font-semibold text-ink">
          {title}
        </h2>
        <p
          id="confirm-desc"
          className="mt-1.5 text-[13px] font-semibold leading-relaxed text-muted"
        >
          {description}
        </p>
        <div className="mt-5 flex gap-2.5">
          <Button variant="danger" size="sm" onClick={onConfirm} disabled={busy} block>
            {confirmLabel}
          </Button>
          <Button variant="quiet" size="sm" onClick={onCancel} ref={cancelRef} block>
            {cancelLabel ?? t('common.cancel')}
          </Button>
        </div>
      </div>
    </div>
  )
}
