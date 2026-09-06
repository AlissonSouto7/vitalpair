# Feature: browser tests and accessible forms

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped, partially applied (see "Dívida conhecida")
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-06

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

| Layer           | Files                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------- |
| Configuration   | `frontend/playwright.config.ts`                                                           |
| Shared setup    | `frontend/e2e/support/session.setup.ts`, `frontend/e2e/support/accounts.ts`               |
| Specs           | `frontend/e2e/auth.spec.ts`, `frontend/e2e/navigation.spec.ts`                            |
| Form primitives | `frontend/src/shared/ui/form/TextField.tsx`, `frontend/src/shared/ui/form/FormError.tsx`  |
| Migrated forms  | `frontend/src/features/auth/LoginPage.tsx`, `frontend/src/features/auth/RegisterPage.tsx` |
| CI              | `.github/workflows/ci.yml`, job `e2e`                                                     |

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

**A-1 (médio, corrigido): campos de formulário sem rótulo acessível.** Login e
cadastro escreviam `<label>` ao lado de `<input>` sem nada ligando os dois. Para
quem usa leitor de tela, o campo era uma caixa de edição sem nome; clicar no
texto não focava o campo. Descoberto porque o teste de navegador não conseguia
encontrar os campos pelo rótulo, que é exatamente o mesmo caminho que a
tecnologia assistiva usa. Corrigido em `TextField`, que gera o `id` e liga
`htmlFor`, `aria-invalid` e `aria-describedby`.

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

| Teste                    | Risco que protege                                                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.spec.ts` (7)       | cadastro que não leva pra dentro; login quebrado; sessão perdida ao recarregar; erro sem mensagem; formulário inválido chamando o servidor; rota protegida aberta |
| `navigation.spec.ts` (5) | 404 redirecionando em silêncio; página legal mostrando chave de tradução; tela cujo pedaço de código não carrega; troca de idioma quebrada                        |
| `errors.test.ts` (9)     | leitura de erro da API (fase 9)                                                                                                                                   |
| `locales.test.ts` (89)   | chave de tradução faltando                                                                                                                                        |

### O que NÃO está coberto

- **Só Chromium.** Firefox e Safari estão configurados no Playwright mas não
  habilitados; rodar três navegadores triplica o tempo sem, hoje, cobrir um risco
  conhecido.
- **Nenhum percurso de negócio ponta a ponta**: registrar refeição, gerar plano,
  convidar parceiro. A suíte cobre entrada e navegação.
- **Sem teste de responsividade** nem de viewport móvel.
- **Sem teste de componente** (Testing Library) ainda: os formulários migrados
  são cobertos pelo navegador, não isoladamente.
- **MSW não foi introduzido**: os testes usam o backend real, que é mais fiel e
  foi o que expôs o CORS e o limite de taxa.

## Dívida conhecida

- **Só 2 dos 9 formulários** usam react-hook-form + zod (login e cadastro). Os
  outros sete continuam com estado manual e labels não associados, ou seja, o
  achado A-1 continua aberto neles.
- **As páginas grandes não foram decompostas.** `NutritionPage` tem 960 linhas,
  `OnboardingPage` 781. O plano previa quebrar em componentes e ligar
  `max-lines: 300` como erro; não foi feito.
- **9 avisos de lint** continuam, nas telas que ainda buscam dados com
  `useEffect`.

## Histórico

- **2026-09-06**: fase 10 parcial. Playwright com 12 testes, job de CI, primitivos
  de formulário acessíveis, login e cadastro migrados para react-hook-form + zod.
  Achado A-1 corrigido nesses dois. Testes de frontend: 98 unitários + 12 de
  navegador.
