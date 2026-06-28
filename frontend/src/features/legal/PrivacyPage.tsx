import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandLockup } from '../../components/brand/BrandMark'

/**
 * Política de Privacidade do VitalPair.
 * Página standalone: sem Layout/sidebar, scroll próprio, só tokens.
 * Vigência: junho de 2026. Tom honesto, claro, brasileiro.
 */
export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <LegalHeader />

      <main className="mx-auto max-w-[760px] px-5 pb-20 pt-6 sm:px-8">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-rival-soft px-3.5 py-1.5 text-xs font-extrabold text-rival-ink">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-rival" aria-hidden="true">
            <path d="M12 1 4 4v7c0 5 3.4 8.6 8 11 4.6-2.4 8-6 8-11V4zm0 6a2.5 2.5 0 012.5 2.5c0 1-.6 1.8-1.5 2.2V15a1 1 0 01-2 0v-3.3A2.5 2.5 0 0112 7z" />
          </svg>
          seus dados, sem letra miúda
        </span>

        <h1 className="mb-3 font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[42px]">
          Política de Privacidade
        </h1>
        <p className="mb-2 text-base font-semibold leading-relaxed text-muted">
          O VitalPair lida com informação de saúde, que é coisa delicada. Aqui a gente explica em
          português normal o que coletamos, por que coletamos e o que você pode mandar a gente
          fazer com isso. Sem juridiquês escondendo o jogo.
        </p>
        <p className="mb-9 text-[13.5px] font-bold text-faint">Vigência: junho de 2026</p>

        <div className="flex flex-col gap-9">
          <Section n="1" title="Quem é o responsável">
            <P>
              O VitalPair é o controlador dos seus dados pessoais, nos termos da Lei Geral de
              Proteção de Dados (Lei nº 13.709/2018, a LGPD). Quando falamos &ldquo;a gente&rdquo;,
              &ldquo;nós&rdquo; ou &ldquo;VitalPair&rdquo; nesta página, é dessa empresa que estamos
              falando.
            </P>
            <P>
              Dúvida, pedido ou reclamação sobre privacidade você manda direto pro nosso
              encarregado (DPO) no e-mail{' '}
              <Mail>contato@vitapair.app</Mail>. A gente responde.
            </P>
          </Section>

          <Section n="2" title="O que a gente coleta">
            <P>
              Coletamos só o necessário pra o app funcionar do jeito que ele se propõe: você e mais
              alguém numa temporada cuidando da saúde.
            </P>
            <BulletList
              items={[
                ['Cadastro', 'nome, e-mail e senha (a senha fica guardada criptografada, a gente nunca vê ela em texto puro).'],
                ['Perfil de saúde', 'data de nascimento, sexo, altura, peso e seu objetivo. É com isso que estimamos suas metas e calorias.'],
                ['Registros do dia a dia', 'suas refeições (inclusive as fotos de prato que você envia) e suas atividades físicas.'],
                ['Dados de jogo', 'pontuação, sequências, missões e quem é o seu par na temporada.'],
                ['Login pelo Google', 'se você entra com o Google, recebemos do Google seu nome, e-mail e o identificador da conta. Nada além disso.'],
                ['Dados técnicos', 'informações básicas de sessão pra manter você logado e proteger a conta (mais detalhe na seção de cookies).'],
              ]}
            />
            <Callout tone="rival" icon="info">
              Dados de saúde e biométricos são considerados dados sensíveis pela LGPD. Por isso
              tratamos altura, peso, sexo, objetivo e registros alimentares com cuidado extra, e só
              usamos pra te entregar o serviço.
            </Callout>
          </Section>

          <Section n="3" title="Pra que usamos">
            <BulletList
              items={[
                ['Fazer o app funcionar', 'criar e manter sua conta, calcular metas, montar o placar e tocar a temporada.'],
                ['Estimar as calorias da foto', 'quando você fotografa o prato, a imagem é analisada por IA pra estimar o que tem ali. Você confere antes de confirmar.'],
                ['Mostrar seu progresso', 'gráficos, sequências, histórico e comparação com o seu par.'],
                ['Cuidar da segurança', 'detectar acesso indevido, prevenir fraude e proteger as contas.'],
                ['Falar com você', 'e-mails sobre a conta, como verificação e recuperação de senha. Nada de spam.'],
              ]}
            />
          </Section>

          <Section n="4" title="Com que base legal">
            <P>A LGPD exige que todo tratamento tenha uma base legal. As nossas são:</P>
            <BulletList
              items={[
                ['Execução de contrato', 'a maior parte dos dados é tratada porque é o que faz o serviço que você contratou funcionar.'],
                ['Consentimento', 'pros dados sensíveis de saúde (peso, altura, sexo, objetivo, refeições e atividades) pedimos seu consentimento, que você pode retirar quando quiser.'],
                ['Legítimo interesse', 'pra segurança, prevenção de fraude e melhoria do produto, sempre respeitando seus direitos.'],
                ['Cumprimento de obrigação legal', 'quando a lei nos obriga a guardar algo por um prazo.'],
              ]}
            />
          </Section>

          <Section n="5" title="Com quem a gente compartilha">
            <P>
              A gente não vende seus dados. Ponto. Compartilhamos só com quem é necessário pra o app
              rodar, e cada um trata os dados de forma limitada:
            </P>
            <BulletList
              items={[
                ['Google (login)', 'se você usa &ldquo;entrar com Google&rdquo;, a autenticação passa pelo Google (OAuth2). O Google trata isso pela política dele.'],
                ['Anthropic (IA da foto)', 'a imagem do prato é enviada pra Anthropic, que processa a foto pra estimar as calorias e devolve o resultado. É um provedor de IA, atuando como operador a nosso pedido.'],
                ['Infraestrutura', 'serviços de hospedagem e banco de dados (PostgreSQL) que armazenam os dados pra gente, sob contrato e com obrigação de sigilo.'],
                ['Autoridades', 'só se formos legalmente obrigados, por ordem judicial ou requisição legítima.'],
              ]}
            />
            <Callout tone="brand" icon="alert">
              Seu par enxerga seu placar, suas sequências e o fato de você ter registrado algo, isso
              faz parte do jogo. Mas o conteúdo detalhado dos seus registros e seus dados de perfil
              continuam seus.
            </Callout>
          </Section>

          <Section n="6" title="Por quanto tempo guardamos">
            <P>
              Mantemos seus dados enquanto sua conta estiver ativa. Se você apagar a conta, removemos
              seus dados pessoais em até 30 dias, salvo o que a lei nos obrigue a reter por mais
              tempo (e nesse caso fica isolado, só pra cumprir a obrigação). Backups técnicos podem
              levar um pouco mais pra expirar dentro do ciclo normal de rotação.
            </P>
          </Section>

          <Section n="7" title="Seus direitos">
            <P>Como titular dos dados, a LGPD te garante, e a gente respeita:</P>
            <BulletList
              items={[
                ['Acesso', 'saber quais dados seus a gente tem.'],
                ['Correção', 'arrumar dado incompleto ou errado.'],
                ['Exclusão', 'pedir pra apagar seus dados e encerrar a conta.'],
                ['Portabilidade', 'receber seus dados num formato legível.'],
                ['Revogar consentimento', 'tirar o consentimento dos dados de saúde a qualquer momento.'],
                ['Informação', 'saber com quem compartilhamos e por quê.'],
              ]}
            />
            <P>
              Pra exercer qualquer um desses, escreve pra <Mail>contato@vitapair.app</Mail>. Boa
              parte você também resolve direto nas configurações da conta.
            </P>
          </Section>

          <Section n="8" title="Cookies e sessão">
            <P>
              A gente usa o mínimo. Guardamos um cookie ou token de sessão pra te manter logado e
              pra proteger a sua conta. Sem isso, você teria que digitar a senha a cada clique. Não
              usamos cookies pra te perseguir com publicidade por aí.
            </P>
          </Section>

          <Section n="9" title="Segurança">
            <P>
              Senhas ficam criptografadas, o tráfego trafega em HTTPS e o acesso interno aos dados é
              restrito a quem precisa. Nenhum sistema é 100% à prova de falha, mas a gente leva
              segurança a sério e, se algo grave acontecer, te avisamos e avisamos a ANPD conforme a
              lei manda.
            </P>
          </Section>

          <Section n="10" title="Mudanças nesta política">
            <P>
              Se a gente mudar algo relevante aqui, atualiza a data de vigência no topo e, quando for
              mudança importante, avisa você dentro do app ou por e-mail. Continuar usando o VitalPair
              depois disso significa que você está de acordo com a versão nova.
            </P>
          </Section>

          <Section n="11" title="Falar com o encarregado">
            <P>
              Qualquer assunto de privacidade, dúvida sobre seus dados ou exercício de direito é só
              mandar pra <Mail>contato@vitapair.app</Mail>. Tem gente de verdade lendo.
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
        <Link to="/termos" className="cursor-pointer transition hover:text-ink">
          Termos
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
  tone: 'brand' | 'rival'
  icon: 'info' | 'alert'
  children: ReactNode
}) {
  const toneClasses = {
    brand: 'border-brand/30 bg-brand-soft',
    rival: 'border-rival/30 bg-rival-soft',
  }[tone]
  const fill = tone === 'brand' ? 'fill-brand' : 'fill-rival'

  return (
    <div className={`flex gap-3 rounded-2xl border p-4 ${toneClasses}`}>
      <svg viewBox="0 0 24 24" className={`mt-0.5 h-5 w-5 flex-shrink-0 ${fill}`} aria-hidden="true">
        {icon === 'info' ? (
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 5a1.4 1.4 0 110 2.8A1.4 1.4 0 0112 7zm1.3 10h-2.6v-6h2.6z" />
        ) : (
          <path d="M12 2 1 21h22zm0 6a1.3 1.3 0 011.3 1.3v5a1.3 1.3 0 01-2.6 0v-5A1.3 1.3 0 0112 8zm0 9.5a1.4 1.4 0 110 2.8 1.4 1.4 0 010-2.8z" />
        )}
      </svg>
      <p className="text-[14px] font-bold leading-relaxed text-ink">{children}</p>
    </div>
  )
}
