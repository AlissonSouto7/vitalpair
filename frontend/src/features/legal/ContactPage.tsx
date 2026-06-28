import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandLockup } from '../../components/brand/BrandMark'

/**
 * Página de Contato do VitalPair.
 * Página standalone: sem Layout/sidebar, scroll próprio, só tokens.
 * O formulário ainda não envia: faz preventDefault e mostra estado de "recebido".
 */
export function ContactPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <LegalHeader />

      <main className="mx-auto max-w-[760px] px-5 pb-20 pt-6 sm:px-8">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-success-soft px-3.5 py-1.5 text-xs font-extrabold text-success-ink">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-success" aria-hidden="true">
            <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 3.2V6l8 5 8-5v1.2l-8 5z" />
          </svg>
          tem gente de verdade do outro lado
        </span>

        <h1 className="mb-3 font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[42px]">
          Fala com a gente
        </h1>
        <p className="mb-9 max-w-[520px] text-base font-semibold leading-relaxed text-muted">
          Bug, sugestão, dúvida sobre seus dados ou só pra contar como foi sua temporada. Escreve
          aqui que a gente responde. Sem robô, sem ticket número 4827.
        </p>

        <div className="grid gap-6 lg:grid-cols-[1fr_.85fr]">
          <ContactForm />
          <SideInfo />
        </div>

        <Faq />

        <LegalFooter />
      </main>
    </div>
  )
}

/* ===================== formulário ===================== */

function ContactForm() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // TODO: ligar envio no backend (POST /contact). Por ora só mostra o estado de recebido.
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-success/30 bg-success-soft p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success">
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white" aria-hidden="true">
            <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
          </svg>
        </div>
        <h2 className="mb-2 font-display text-[22px] font-semibold text-ink">Mensagem recebida</h2>
        <p className="mb-6 max-w-[340px] text-[14px] font-semibold leading-relaxed text-muted">
          Anotamos seu recado. A gente costuma responder em até um dia útil no e-mail que você
          deixou.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-hair bg-surface px-4 py-2.5 text-[13.5px] font-extrabold text-ink transition hover:border-brand"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M12 5V2L7 7l5 5V9a5 5 0 11-5 5H5a7 7 0 107-7z" />
          </svg>
          Mandar outra
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-3xl border border-hair bg-surface p-6 shadow-[0_10px_30px_rgba(70,45,20,0.06)]"
    >
      <Field id="contact-name" label="Seu nome" icon="user">
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          placeholder="Como te chamamos?"
          className="w-full rounded-xl border border-hair bg-canvas px-3.5 py-2.5 text-[15px] font-semibold text-ink placeholder-faint outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
      </Field>

      <Field id="contact-email" label="Seu e-mail" icon="mail">
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          placeholder="pra gente te responder"
          className="w-full rounded-xl border border-hair bg-canvas px-3.5 py-2.5 text-[15px] font-semibold text-ink placeholder-faint outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
      </Field>

      <Field id="contact-message" label="Sua mensagem" icon="chat">
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          placeholder="Conta o que rolou ou o que você precisa."
          className="w-full resize-y rounded-xl border border-hair bg-canvas px-3.5 py-2.5 text-[15px] font-semibold leading-relaxed text-ink placeholder-faint outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
      </Field>

      <button
        type="submit"
        className="mt-1 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-[15px] font-extrabold text-white transition hover:brightness-105"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white" aria-hidden="true">
          <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
        </svg>
        Enviar mensagem
      </button>

      <p className="text-center text-[12px] font-bold text-faint">
        A gente usa seu e-mail só pra responder este contato.
      </p>
    </form>
  )
}

function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string
  label: string
  icon: 'user' | 'mail' | 'chat'
  children: ReactNode
}) {
  const path = {
    user: 'M12 12a5 5 0 100-10 5 5 0 000 10zm-8 9c0-4 3.6-6 8-6s8 2 8 6v1H4z',
    mail: 'M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 3.2V6l8 5 8-5v1.2l-8 5z',
    chat: 'M4 3h16a2 2 0 012 2v10a2 2 0 01-2 2H8l-5 4V5a2 2 0 011-2z',
  }[icon]

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center gap-2 text-[13px] font-extrabold text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-muted" aria-hidden="true">
          <path d={path} />
        </svg>
        {label}
      </label>
      {children}
    </div>
  )
}

function SideInfo() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl border border-arena-border bg-arena p-6 shadow-[0_20px_50px_var(--arena-shadow)]">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand">
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-white" aria-hidden="true">
            <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 3.2V6l8 5 8-5v1.2l-8 5z" />
          </svg>
        </div>
        <div className="mb-1 text-[11px] font-extrabold tracking-[0.12em] text-arena-muted">
          E-MAIL DIRETO
        </div>
        <a
          href="mailto:contato@vitapair.app"
          className="cursor-pointer font-display text-[19px] font-semibold text-arena-text underline decoration-transparent underline-offset-2 transition hover:decoration-brand"
        >
          contato@vitapair.app
        </a>
        <p className="mt-3 text-[13px] font-semibold leading-relaxed text-arena-muted">
          Prefere mandar do seu próprio e-mail? Pode ser por aqui também. É o mesmo canal pra
          assuntos de privacidade e exercício dos seus direitos.
        </p>
      </div>

      <div className="rounded-3xl border border-hair bg-surface p-6">
        <div className="mb-1 flex items-center gap-2 text-[13px] font-extrabold text-ink">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-success" aria-hidden="true">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5h-2v6l5 3 1-1.7-4-2.3z" />
          </svg>
          Tempo de resposta
        </div>
        <p className="text-[13px] font-semibold leading-relaxed text-muted">
          Normalmente até 1 dia útil. Bug grave a gente prioriza.
        </p>
      </div>
    </div>
  )
}

/* ===================== FAQ ===================== */

function Faq() {
  const items: [string, ReactNode][] = [
    [
      'O VitalPair é gratuito?',
      <>
        A primeira temporada é de graça e a gente nem pede cartão. Lá na frente vai ter um plano pago
        com recursos extras, mas a gente pretende manter um nível gratuito.
      </>,
    ],
    [
      'A foto do prato vai pra onde?',
      <>
        A imagem é analisada por IA (Anthropic) só pra estimar as calorias e te devolver o resultado.
        Detalhe completo está na{' '}
        <Link
          to="/privacidade"
          className="cursor-pointer font-extrabold text-brand-ink underline decoration-brand/40 underline-offset-2 transition hover:decoration-brand"
        >
          Política de Privacidade
        </Link>
        .
      </>,
    ],
    [
      'Como apago minha conta e meus dados?',
      <>
        Dá pra encerrar a conta nas configurações, ou mandar um e-mail pra{' '}
        <a
          href="mailto:contato@vitapair.app"
          className="cursor-pointer font-extrabold text-brand-ink underline decoration-brand/40 underline-offset-2 transition hover:decoration-brand"
        >
          contato@vitapair.app
        </a>{' '}
        que a gente resolve.
      </>,
    ],
  ]

  return (
    <section className="mt-12">
      <h2 className="mb-5 font-display text-[24px] font-semibold tracking-[-0.01em] text-ink">
        Perguntas rápidas
      </h2>
      <div className="flex flex-col gap-3">
        {items.map(([q, a]) => (
          <div key={q} className="rounded-2xl border border-hair bg-surface p-5">
            <h3 className="mb-1.5 flex items-start gap-2.5 font-display text-[16px] font-semibold text-ink">
              <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 flex-shrink-0 fill-brand" aria-hidden="true">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 15.5a1.3 1.3 0 110 2.6 1.3 1.3 0 010-2.6zm1.6-4.4c-.6.5-.6.6-.6 1.4h-2c0-1.4.3-2 1.2-2.7.7-.6 1-.9 1-1.6a1.2 1.2 0 00-2.4-.1H8.8a3.2 3.2 0 116.4.1c0 1.3-.5 1.9-1.6 2.5z" />
              </svg>
              {q}
            </h3>
            <p className="pl-[26px] text-[14px] font-semibold leading-relaxed text-muted">{a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ===================== chrome local ===================== */

function LegalHeader() {
  return (
    <header className="border-b border-hair bg-canvas/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="cursor-pointer transition hover:opacity-90">
          <BrandLockup size={38} />
        </Link>
        <Link
          to="/"
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-hair bg-surface px-4 py-2 text-[13.5px] font-extrabold text-ink transition hover:border-brand"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M14 6l-6 6 6 6 1.4-1.4L10.8 12l4.6-4.6z" />
          </svg>
          Voltar
        </Link>
      </div>
    </header>
  )
}

function LegalFooter() {
  return (
    <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-hair pt-6 text-center sm:flex-row sm:text-left">
      <span className="text-[12.5px] font-bold text-muted">
        © 2026 VitalPair · Saúde é melhor em dupla
      </span>
      <div className="flex gap-4 text-[12.5px] font-bold text-muted">
        <Link to="/privacidade" className="cursor-pointer transition hover:text-ink">
          Privacidade
        </Link>
        <Link to="/termos" className="cursor-pointer transition hover:text-ink">
          Termos
        </Link>
      </div>
    </div>
  )
}
