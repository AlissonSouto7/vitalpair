import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandLockup } from '../../components/brand/BrandMark'

/**
 * Termos de Uso do VitalPair.
 * Página standalone: sem Layout/sidebar, scroll próprio, só tokens.
 * Vigência: junho de 2026. Tom honesto, claro, brasileiro.
 */
export function TermsPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <LegalHeader />

      <main className="mx-auto max-w-[760px] px-5 pb-20 pt-6 sm:px-8">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3.5 py-1.5 text-xs font-extrabold text-brand-ink">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-brand" aria-hidden="true">
            <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm8 1.5V8h4.5zM8 12h8v1.6H8zm0 3.5h8v1.6H8z" />
          </svg>
          o combinado da casa
        </span>

        <h1 className="mb-3 font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[42px]">
          Termos de Uso
        </h1>
        <p className="mb-2 text-base font-semibold leading-relaxed text-muted">
          Estas são as regras de usar o VitalPair. Leitura rápida, sem pegadinha. Ao criar conta ou
          usar o app, você concorda com o que está aqui. Se não concordar com alguma coisa, melhor
          não usar.
        </p>
        <p className="mb-9 text-[13.5px] font-bold text-faint">Vigência: junho de 2026</p>

        <div className="flex flex-col gap-9">
          <Section n="1" title="O que é o VitalPair">
            <P>
              O VitalPair é um app web onde duas pessoas (casal, amigos, irmãos, quem topar) competem
              numa temporada de 30 dias cuidando da saúde: registram refeições, inclusive por foto
              com ajuda de IA, registram atividade física, e acompanham placar, sequências e
              missões. A ideia é simples: é mais fácil manter a rotina quando tem alguém junto.
            </P>
          </Section>

          <Section n="2" title="Conta e quem pode usar">
            <BulletList
              items={[
                ['Idade', 'você precisa ter pelo menos 18 anos pra criar uma conta.'],
                ['Dados de verdade', 'use informações reais no cadastro. Altura, peso e objetivo errados estragam suas metas e o jogo.'],
                ['Sua senha é sua', 'mantenha a senha em segredo. Tudo que rolar na sua conta é responsabilidade sua.'],
                ['Login pelo Google', 'você pode entrar com Google. Nesse caso valem também os termos do Google pra autenticação.'],
                ['Uma conta por pessoa', 'nada de criar várias contas pra burlar o placar.'],
              ]}
            />
          </Section>

          <Section n="3" title="Conduta: o que não rola">
            <P>Usando o VitalPair, você se compromete a não:</P>
            <BulletList
              items={[
                ['Fraudar o jogo', 'registrar coisa falsa só pra inflar pontuação ou prejudicar seu par.'],
                ['Atacar o sistema', 'tentar invadir, sobrecarregar, raspar dados ou furar a segurança.'],
                ['Usar conteúdo de terceiros', 'enviar fotos ou conteúdo que não são seus ou que violem direitos de alguém.'],
                ['Assediar', 'usar o app pra incomodar, ofender ou expor outra pessoa.'],
                ['Revender', 'explorar o serviço comercialmente sem a nossa autorização.'],
              ]}
            />
            <P>
              Se você quebrar essas regras, a gente pode suspender ou encerrar sua conta, dependendo
              da gravidade.
            </P>
          </Section>

          <Section n="4" title="Saúde: isto NÃO é orientação médica">
            <Callout tone="danger" icon="alert">
              O VitalPair é uma ferramenta de motivação e acompanhamento, não um profissional de
              saúde. Nada aqui (estimativa de calorias, metas, sugestões, números) substitui a
              orientação de médico, nutricionista ou educador físico.
            </Callout>
            <P>
              As estimativas de caloria a partir de foto são aproximadas, feitas por IA, e podem
              errar. Use como referência, não como verdade absoluta. Antes de mudar dieta, começar
              treino pesado ou tomar qualquer decisão de saúde, fale com um profissional
              qualificado. Se você tem alguma condição de saúde, isso vale em dobro.
            </P>
            <P>
              Em emergência, procure atendimento médico. O VitalPair não é canal de emergência nem de
              aconselhamento clínico.
            </P>
          </Section>

          <Section n="5" title="Plano gratuito e plano pago">
            <P>
              Hoje o VitalPair tem um plano gratuito, que dá pra jogar a primeira temporada sem pagar
              nada e sem precisar de cartão. No futuro vamos ter um plano pago com recursos extras.
            </P>
            <BulletList
              items={[
                ['Sem surpresa', 'a gente nunca vai cobrar de você sem você ter contratado um plano pago de forma clara.'],
                ['Mudança de preço', 'se lançarmos planos pagos, o preço e o que cada plano inclui ficarão visíveis antes de você assinar.'],
                ['O grátis continua', 'a gente pretende manter um nível gratuito, mas pode ajustar o que ele inclui ao longo do tempo.'],
              ]}
            />
          </Section>

          <Section n="6" title="Seu conteúdo e a nossa propriedade">
            <P>
              O que você cria (suas fotos, seus registros, seus dados) continua seu. Você só nos dá
              a permissão necessária pra processar e mostrar esse conteúdo dentro do app, do jeito
              que o serviço precisa pra funcionar.
            </P>
            <P>
              Já a marca VitalPair, o nome, o logo, o design, o código e os textos são nossos. Usar o
              app não te dá direito de copiar, revender ou reaproveitar essas partes sem autorização.
            </P>
          </Section>

          <Section n="7" title="Limitação de responsabilidade">
            <P>
              A gente se esforça pra manter o VitalPair no ar e funcionando, mas o serviço é fornecido
              &ldquo;como está&rdquo;. Pode ter instabilidade, manutenção ou estimativa imprecisa.
              Na medida permitida pela lei, não respondemos por decisões de saúde que você tome com
              base no app, nem por perdas indiretas decorrentes do uso.
            </P>
            <P>
              Nada nestes termos afasta direitos que a legislação brasileira, incluindo o Código de
              Defesa do Consumidor, garante a você como consumidor.
            </P>
          </Section>

          <Section n="8" title="Encerramento de conta">
            <BulletList
              items={[
                ['Você sai quando quiser', 'dá pra encerrar a conta a qualquer momento nas configurações. Seus dados seguem o que diz a Política de Privacidade.'],
                ['A gente pode encerrar', 'se você quebrar estes termos ou usar o app de forma abusiva ou ilegal, podemos suspender ou encerrar o acesso.'],
                ['Aviso quando der', 'sempre que possível, a gente avisa antes de encerrar e explica o motivo.'],
              ]}
            />
          </Section>

          <Section n="9" title="Lei e foro">
            <P>
              Estes termos são regidos pelas leis do Brasil. Qualquer questão que não der pra
              resolver de forma amigável fica no foro do domicílio do usuário, conforme o Código de
              Defesa do Consumidor.
            </P>
          </Section>

          <Section n="10" title="Alterações nestes termos">
            <P>
              A gente pode atualizar estes termos. Quando a mudança for relevante, atualizamos a data
              de vigência no topo e avisamos você no app ou por e-mail. Se você continuar usando o
              VitalPair depois disso, entendemos que você concordou com a versão nova. Se não
              concordar, é só encerrar a conta.
            </P>
          </Section>

          <Section n="11" title="Fala com a gente">
            <P>
              Qualquer dúvida sobre estes termos, escreve pra <Mail>contato@vitapair.app</Mail>.
            </P>
          </Section>
        </div>

        <LegalFooter />
      </main>
    </div>
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
        <Link to="/contato" className="cursor-pointer transition hover:text-ink">
          Contato
        </Link>
      </div>
    </div>
  )
}

function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section className="scroll-mt-20">
      <h2 className="mb-3 flex items-baseline gap-2.5 font-display text-[22px] font-semibold tracking-[-0.01em] text-ink sm:text-[24px]">
        <span className="font-display text-[15px] font-semibold text-brand-ink">{n}.</span>
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-[15px] font-semibold leading-relaxed text-muted">{children}</p>
}

function Mail({ children }: { children: ReactNode }) {
  return (
    <a
      href={`mailto:${children}`}
      className="cursor-pointer font-extrabold text-brand-ink underline decoration-brand/40 underline-offset-2 transition hover:decoration-brand"
    >
      {children}
    </a>
  )
}

function BulletList({ items }: { items: [string, string][] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map(([term, desc]) => (
        <li key={term} className="flex gap-3">
          <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand" aria-hidden="true" />
          <span className="text-[15px] font-semibold leading-relaxed text-muted">
            <span className="font-extrabold text-ink">{term}:</span> {desc}
          </span>
        </li>
      ))}
    </ul>
  )
}

function Callout({
  tone,
  icon,
  children,
}: {
  tone: 'danger'
  icon: 'alert'
  children: ReactNode
}) {
  void tone
  void icon
  return (
    <div className="flex gap-3 rounded-2xl border border-danger/40 bg-danger-soft p-4">
      <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 flex-shrink-0 fill-danger" aria-hidden="true">
        <path d="M12 2 1 21h22zm0 6a1.3 1.3 0 011.3 1.3v5a1.3 1.3 0 01-2.6 0v-5A1.3 1.3 0 0112 8zm0 9.5a1.4 1.4 0 110 2.8 1.4 1.4 0 010-2.8z" />
      </svg>
      <p className="text-[14px] font-bold leading-relaxed text-ink">{children}</p>
    </div>
  )
}
