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

  /*
    Sem `action`, a estrutura simples: rótulo, campo, erro.

    Com `action`, tudo vira uma grade de uma coluna em que o link é escrito depois do campo e
    volta para cima pelo `order`. Escrito antes, como estava, ele entrava no meio do formulário
    para quem navega por teclado: medido na tela de entrar, a sequência do Tab era e-mail ->
    "Esqueci" -> senha, ou seja, o caminho para sair da página passava entre os dois campos que
    a pessoa está preenchendo, e um toque a mais no Tab a tirava dali sem ela querer. Quem usa
    teclado ou leitor de tela segue a ordem do HTML; quem usa o olho segue a desenhada. As duas
    passam a dizer a mesma coisa.
  */
  const campo = (
    <input
      {...input}
      id={id}
      onAnimationStart={onAnimationStart}
      className="input"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
    />
  )
  const mensagem = error && (
    <p id={errorId} role="alert" className="mt-1 text-xs font-semibold text-danger">
      {error}
    </p>
  )

  if (!action) {
    return (
      <div>
        <label htmlFor={id} className="label">
          {label}
        </label>
        {campo}
        {mensagem}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center">
      {/*
        A ordem do HTML é rótulo, campo, link; a ordem desenhada é rótulo, link, campo.

        `order` muda só o desenho, e é por isso que serve aqui: a ordem do Tab e a leitura de um
        leitor de tela continuam seguindo o HTML, onde o link vem depois do campo, que é onde
        ele faz sentido. O `basis-full` em rótulo e campo os força a ocupar a linha inteira, e o
        link sobra no canto da primeira.
      */}
      <label htmlFor={id} className="label order-1 mb-1 mr-auto">
        {label}
      </label>
      <div className="order-3 mb-0 basis-full">{campo}</div>
      <div className="order-2 mb-1">{action}</div>
      {mensagem && <div className="order-4 basis-full">{mensagem}</div>}
    </div>
  )
}
