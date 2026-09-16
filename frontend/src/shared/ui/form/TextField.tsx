import { useId, type AnimationEvent, type InputHTMLAttributes, type ReactNode } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  /** Validation message for this field, already translated. */
  error?: string
  /** Rendered beside the label: a "forgot password" link, for instance. */
  action?: ReactNode
}

/**
 * A labelled input.
 *
 * The forms wrote `<label>` next to `<input>` with nothing tying them together, so the
 * label was decoration: a screen reader announced an unnamed edit box, clicking the text
 * did not focus the field, and a test could not find the input by its label either. The id
 * is generated rather than passed in, because two instances of the same form on one page
 * would otherwise share it.
 *
 * The error is linked through aria-describedby, so assistive technology reads the message
 * with the field instead of leaving it as loose text somewhere on the page.
 *
 * Também avisa o formulário quando o navegador preenche o campo sozinho. O Chrome nem sempre
 * dispara `input` ao preencher pela lista de sugestões, e sem isso o formulário fica com o
 * valor antigo: o campo mostra um e-mail correto e a mensagem de e-mail inválido continua
 * embaixo dele, sem nada que a apague. Ele dispara uma animação ao aplicar o autopreenchimento
 * (vp-autofilled, em index.css), e é ela que serve de sinal.
 */
export function TextField({ label, error, action, ...input }: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  /*
    Reenvia o valor que o navegador escreveu, como se a pessoa o tivesse digitado. O `onChange`
    aqui é o do react-hook-form, que chega pelo `register`; sem este empurrão ele nunca fica
    sabendo do preenchimento.
  */
  function onAnimationStart(event: AnimationEvent<HTMLInputElement>) {
    if (event.animationName === 'vp-autofilled') {
      input.onChange?.(event as unknown as Parameters<NonNullable<typeof input.onChange>>[0])
    }
    input.onAnimationStart?.(event)
  }

  return (
    <div>
      <div className={action ? 'mb-1 flex items-center justify-between' : undefined}>
        <label htmlFor={id} className={action ? 'label mb-0' : 'label'}>
          {label}
        </label>
        {action}
      </div>
      <input
        {...input}
        id={id}
        onAnimationStart={onAnimationStart}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
