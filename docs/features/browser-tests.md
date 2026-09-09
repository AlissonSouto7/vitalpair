# Feature: browser tests and accessible forms

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped, partially applied (see "Dívida conhecida")
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-09

## What it is and where it lives

A Playwright suite that drives the real application in a real browser, plus the
form primitives the suite needs to exist at all: inputs whose labels are actually
attached to them.

|                   |                                             |
| ----------------- | ------------------------------------------- |
| Frontend route    | none directly; the suite drives all of them |
| Who can access it | developers and CI                           |
| Backend package   | none                                        |
| Feature flag      | none                                        |

## Architecture

| Layer           | Files                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Configuration   | `frontend/playwright.config.ts`                                                                               |
| Shared setup    | `frontend/e2e/support/session.setup.ts`, `frontend/e2e/support/accounts.ts`                                   |
| Specs           | `auth`, `navigation`, `accessibility`, `errors`, `onboarding`, `nutrition`, `pair` (todos em `frontend/e2e/`) |
| Form primitives | `frontend/src/shared/ui/form/TextField.tsx`, `frontend/src/shared/ui/form/FormError.tsx`                      |
| Migrated forms  | `frontend/src/features/auth/LoginPage.tsx`, `frontend/src/features/auth/RegisterPage.tsx`                     |
| CI              | `.github/workflows/ci.yml`, job `e2e`                                                                         |

### How to run

```bash
# Needs the backend on :8081 and CORS allowing http://localhost:4173
npm --prefix frontend run build
npm --prefix frontend run e2e          # headless
npm --prefix frontend run e2e:ui       # interactive
npm --prefix frontend run e2e:report   # open the last report
```

## Regras de negócio

- **The suite runs against the production build**, served by `vite preview`, not
  the dev server. The dev server transforms modules on demand and hides bundling
  mistakes that only appear in the artefact users receive.
- **Os limites de taxa sobem só para esta suíte.** Ela roda em série a partir de um
  endereço só e renova a sessão em toda tela que abre, então disputa consigo mesma
  uma cota dimensionada para uma pessoa. O que estoura primeiro é o `refresh`, a
  cerca de uma chamada por página carregada, e o sintoma era um teste diferente
  falhando a cada rodada. O job de CI define
  `VITALPAIR_RATELIMIT_{LOGIN,REGISTER,REFRESH}_PER_MINUTE`; produção mantém 10, 5
  e 30, que são os padrões no código. `RateLimitIT` continua provando o guarda nos
  números de produção, e `RateLimitFilterTest` prova que a configuração pega.

  Medido antes: duas rodadas seguidas da suíte **já falhavam**, mesmo sem os testes
  novos, e ninguém tinha visto porque ninguém rodava duas vezes em sequência.
  Depois: três rodadas seguidas, 19 testes passando em cada uma.

- **The suite is serial, on purpose.** Every test signs in as the same account
  against one backend, and registration is rate-limited to five a minute per
  address. Measured: 10 of 12 passing in parallel against 12 of 12 serially. The
  limit is correct; the suite adapts to it rather than the limit being weakened.
- **One account for the whole run.** A setup project registers it once and saves
  its credentials; the specs that are not about registering sign in as it.
- **The interface language is pinned to Portuguese** before anything is
  asserted. Matching text in four languages at once is unreadable and matches the
  wrong control; the language switch has its own test.
- **A form validates before it submits.** The browser's `required` and
  `type="email"` are convenience, not a guard, and their messages are the
  browser's, in the browser's language. `AuthFlowIT` proves the server validates
  regardless.

## Achados de segurança

### Corrigidos nesta fase

**A-1 (médio, corrigido em todas as telas): campos de formulário sem rótulo
acessível.** Os formulários escreviam `<label>` ao lado de `<input>` sem nada
ligando os dois. Para quem usa leitor de tela, o campo era uma caixa de edição
sem nome; clicar no texto não focava o campo. Descoberto porque o teste de
navegador não conseguia encontrar os campos pelo rótulo, que é exatamente o mesmo
caminho que a tecnologia assistiva usa.

Medido: 20 rótulos soltos em 8 arquivos no início, zero no fim. A correção não
foi só marcar um por um: `TextField`, `NumberField` e `Field` geram o `id` e
ligam `htmlFor`, `aria-invalid` e `aria-describedby`, e `NumberField` substituiu
duas cópias idênticas do mesmo componente que existiam em telas diferentes, cada
uma com o mesmo defeito.

**A-2 (médio, corrigido): dropdown sem semântica.** `Select` é construído com
botões para poder ser estilizado, o que custa acessibilidade se não for pago:
sem `role="combobox"`, `aria-expanded` e `role="listbox"`, a tecnologia
assistiva não sabe que aquilo é um seletor, o que está selecionado, nem se a
lista está aberta.

**A-3 (baixo, corrigido): campo de convite identificado só por placeholder.** O
placeholder some no primeiro caractere digitado e pode nunca ser anunciado. O
campo passou a carregar o título da seção como nome.

**A-4 (médio, corrigido): grupo de data sem nome acessível.** `DateField`
desenha `role="group"` em volta de três dropdowns, e o rótulo apontava para ele
com `<label htmlFor>`. Um `label` nomeia um controle de formulário, e um grupo
não é um: o grupo saía anônimo e um leitor de tela lia três dropdowns sem nome.
`aria-labelledby` é o atributo que nomeia um grupo, então `labelId` passou a ser
obrigatório em vez de opcional, e `Field` ganhou `labelsAGroup` para renderizar
`<span id>` no lugar de `<label htmlFor>`. Descoberto pelo teste de onboarding,
que não conseguiu encontrar o grupo pelo nome.

**A-5 (alto, corrigido): a data de nascimento não podia ser preenchida.**
`DateField` não guardava estado: lia dia, mês e ano de volta do `value`, e
`value` só vira uma data ISO quando os três existem. Escolher o dia emitia `''`,
o componente relia `''` e o dropdown voltava para o placeholder. Os três juntos
também não funcionavam.

Medido em navegador de verdade, escolhendo dia, mês e ano em sequência:
`AFTER ALL THREE ["Dia","Mês","Ano"]`. Como o passo 1 do onboarding exige a data
para avançar, nenhuma conta nova conseguia terminar o cadastro, e no perfil a
data também não podia ser alterada. Corrigido guardando as três partes no
componente e ajustando durante a renderização quando o pai troca o `value`.
Prova vermelho para verde em `DateField.test.tsx`: 2 de 3 falhando antes, 4 de 4
passando depois; reintroduzir o bug original derruba 2 dos 4.

### Verificados e OK

- **Erro de formulário é anunciado**: `FormError` e as mensagens de campo usam
  `role="alert"`, então um leitor de tela avisa quando aparecem.
- **A barra de força da senha é decorativa** e está marcada `aria-hidden`, para
  não ser lida como conteúdo.
- **O limite de cadastro por IP funciona**: foi ele que quebrou a suíte quando os
  testes rodavam em paralelo, o que é a prova de que está ativo.
- **Nenhuma credencial em código**: a suíte gera e-mails únicos e usa uma senha
  de teste; nada de conta real.
- **Zero vulnerabilidades de produção**: `npm audit --omit=dev` continua limpo
  depois de instalar Playwright, react-hook-form e zod.

### Abertos

- **A suíte precisa de `http://localhost:4173` no CORS.** Sem isso todo pedido
  volta 403 e os testes falham por um motivo que não é o app. Está no
  `.env.example` e no job de CI.

## Testes: o que cada um protege

| Teste                       | Risco que protege                                                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.spec.ts` (7)          | cadastro que não leva pra dentro; login quebrado; sessão perdida ao recarregar; erro sem mensagem; formulário inválido chamando o servidor; rota protegida aberta |
| `navigation.spec.ts` (4)    | 404 redirecionando em silêncio; página legal mostrando chave de tradução; tela cujo pedaço de código não carrega; troca de idioma quebrada                        |
| `accessibility.spec.ts` (2) | regressão do achado A-1: qualquer controle sem rótulo em 8 telas volta a quebrar o build                                                                          |
| `onboarding.spec.ts` (2)    | os cinco passos que toda conta nova percorre uma vez; formulário vazio recusado com a mensagem por campo e `aria-invalid`. Achou A-4 e A-5                        |
| `nutrition.spec.ts` (1)     | refeição que salva e some da lista do dia. Achou o bug de fuso na virada do dia                                                                                   |
| `pair.spec.ts` (1)          | o fluxo que define o produto: convite → aceite com os dois lados confirmando; código inexistente sem mensagem; link de convite morto falhando calado              |
| `errors.spec.ts` (1)        | 5xx sem aviso na tela e sem o código da requisição                                                                                                                |
| `DateField.test.tsx` (4)    | regressão de A-5: data parcial que volta pro placeholder, e data completa que não vira ISO                                                                        |
| `errors.test.ts` (9)        | leitura de erro da API (fase 9)                                                                                                                                   |
| `locales.test.ts` (89)      | chave de tradução faltando                                                                                                                                        |

### O que NÃO está coberto

- **Só Chromium.** Firefox e Safari estão configurados no Playwright mas não
  habilitados; rodar três navegadores triplica o tempo sem, hoje, cobrir um risco
  conhecido.
- **Gerar plano de IA não tem percurso**, porque gastaria chamada paga a cada
  rodada. Convite, aceite, onboarding e registro de refeição têm.
- **Só um caminho por fluxo.** O teste de dupla cobre convidar e aceitar; não
  cobre desfazer a dupla e refazer com outra pessoa, nem convite expirado.
- **Sem teste de responsividade** nem de viewport móvel.
- ~~**Sem teste de componente** (Testing Library) ainda: os formulários migrados
  são cobertos pelo navegador, não isoladamente.~~ Desde a fase 10a há testes de
  componente com MSW (`frontend-foundation.md` lista cada um). Em 09/09 o
  onboarding ganhou os dele, `OnboardingPage.test.tsx` (5), que escolhem a data
  e o sexo nos dropdowns por dentro do teste.
- **MSW não foi introduzido**: os testes usam o backend real, que é mais fiel e
  foi o que expôs o CORS e o limite de taxa.

## Dívida conhecida

- ~~**4 dos 9 formulários** usam react-hook-form + zod (login, cadastro, esqueci a
  senha, redefinir senha). Os outros cinco continuam com estado manual, embora os
  rótulos já estejam corrigidos em todos.~~ Fechado em 09/09: os 10 arquivos com
  `<form>` usam react-hook-form + zod, os cinco da fase 10a e, por último, o
  onboarding, que não tinha nem o elemento `<form>`. O editor de refeição fica
  fora de propósito: é uma lista de itens em rascunho com quantidade, não um
  formulário com envio, e tem os próprios testes em `NutritionPage.test.tsx`.
- ~~**As páginas grandes não foram decompostas.** `NutritionPage` tem 960 linhas,
  `OnboardingPage` 781. O plano previa quebrar em componentes e ligar
  `max-lines: 300` como erro; não foi feito.~~ Feito em 09/09: 3 arquivos acima
  de 300 linhas por `wc -l`, e `max-lines` é erro em 325. Detalhe em
  `frontend-foundation.md`.
- ~~**9 avisos de lint** continuam, nas telas que ainda buscam dados com
  `useEffect`.~~ Zerados em 09/09, com as telas no TanStack Query.

## Histórico

- **2026-09-09**: o passo 1 do onboarding em react-hook-form + zod, o último
  formulário que faltava. `onboarding.spec.ts` passou a exigir, no navegador, a
  mensagem ao lado do campo e o `aria-invalid` no campo vazio, além do resumo
  que já pedia. 20 testes de navegador, 175 unitários.

- **2026-09-09**: percurso de dupla. `pair.spec.ts`, duas pessoas em contextos
  separados, o convite lido da tela e os dois lados confirmando. Achou que a
  suíte não aguentava duas rodadas seguidas, o que já era verdade antes dela: o
  limite de `refresh` estourava porque cada tela aberta renova a sessão. Os três
  limites viraram configuração, com produção nos mesmos números. Três rodadas
  seguidas passando, 19 testes cada.

- **2026-09-08**: percurso de onboarding. `onboarding.spec.ts`, que achou A-4 e
  A-5. Testes de frontend: 147 unitários + 16 de navegador.
- **2026-09-06**: fase 10. Playwright com 14 testes, job de CI, primitivos de
  formulário acessíveis, quatro formulários migrados para react-hook-form + zod.
  Achados A-1, A-2 e A-3 corrigidos em todas as telas, com teste de regressão.
  Testes de frontend: 98 unitários + 14 de navegador.

  Duas lições registradas porque custaram tempo: o primeiro teste de
  acessibilidade passava com um campo sem rótulo inserido de propósito, porque
  checava a página antes de o código da rota chegar e não encontrava controle
  nenhum; e a caminhada pelas telas recarregava o app a cada rota, o que estourava
  o limite de 30 renovações de sessão por minuto e derrubava o login no meio.
  Navegar dentro do app corrigiu e deixou o teste 6x mais rápido.
