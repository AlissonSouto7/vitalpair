# Feature: frontend foundation

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped, partially applied (see "Dívida conhecida")
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-08

## What it is and where it lives

The shared parts of the React application: how code reaches the browser, how a
screen fetches data, how an error is turned into something a person can read, and
what happens when a route does not exist or a render throws.

|                   |               |
| ----------------- | ------------- |
| Frontend route    | all of them   |
| Who can access it | every visitor |
| Backend package   | none          |
| Feature flag      | none          |

## Architecture

| Layer                      | Files                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Routing and code splitting | `src/router/AppRouter.tsx`                                                                                     |
| Data client                | `src/shared/api/queryClient.ts`, `src/features/dashboard/queries.ts`                                           |
| Error reading              | `src/shared/api/errors.ts`                                                                                     |
| Failure screens            | `src/shared/ui/NotFoundPage.tsx`, `src/shared/ui/AppErrorBoundary.tsx`, `src/shared/ui/RouteFallback.tsx`      |
| On-demand translations     | `src/locales/index.ts` (`loadLegalNamespace`), `src/shared/i18n/useLegalNamespace.ts`, `src/locales/errors.ts` |
| Providers                  | `src/App.tsx`                                                                                                  |
| Alias                      | `tsconfig.app.json` (`paths`), `vite.config.ts` (`resolve.alias`)                                              |

## Regras de negócio

- **Every route is loaded on demand.** With static imports the application shipped
  as one file of 742.85 kB, so a visitor opening the login form downloaded all 27
  screens with it. Measured after: an entry chunk of 476 kB across 46 chunks.
- **The legal texts are their own chunk.** They are 69 kB of the 202 kB of
  translations, in four languages, for three pages a person visits once if ever.
  `useLegalNamespace` fetches them when one of those pages opens and the page
  waits, because rendering first would show raw translation keys.
- **A 4xx is never retried.** The same request will fail the same way, and a 401
  is already handled by the axios interceptor, which refreshes and replays once.
- **A mutation is never retried.** It is a deliberate action by a person;
  repeating it silently could log the same meal twice.
- **Errors are read in one place.** Four pages carried their own copy of the
  same helper, each subtly different: one filtered the backend's generic
  "Erro de validação", three showed it to the user. Now all four behave the same.
- **An unknown path shows a 404.** Every unknown path used to redirect to the
  dashboard, which sends a logged-out visitor to the login screen for no stated
  reason and hides a broken link behind what looks like a working one.
- **A render error shows the request id** when the error carries one, so a report
  from a user points straight at the server log line (see `observability.md`).

## Achados de segurança

### Corrigidos nesta fase

**F-1 (alto, corrigido): react-router com vulnerabilidade conhecida.**
`react-router` 7.18.0 estava sujeito a [GHSA-qwww-vcr4-c8h2], bypass de CSRF em
modo RSC. O projeto não usa RSC, então o impacto prático era nulo, mas era uma
dependência de produção vulnerável. Atualizado para 7.18.3; `npm audit
--omit=dev` passou de 2 vulnerabilidades altas para zero (medido).

### Verificados e OK

- **Nenhuma vulnerabilidade de produção**: `npm audit --omit=dev` retorna zero.
  As 6 restantes são de ferramentas de build (`brace-expansion`, `browserslist`,
  `nanoid`, `postcss`), que não vão para o navegador do usuário.
- **Sem token em armazenamento**: a fase 6 já tinha movido o refresh para cookie
  HttpOnly; nada nesta fase reintroduz credencial em `localStorage`.
- **Sem HTML cru**: nenhum `dangerouslySetInnerHTML` foi adicionado.
- **O id de erro exibido não é dado sensível**: é um UUID gerado pelo servidor,
  sem relação com o usuário.

### Abertos

- **8 avisos de `react-hooks/set-state-in-effect`** continuam, em 6 páginas que
  ainda buscam dados com `useEffect`. São avisos, não erros; o padrão sai com a
  migração dessas páginas (ver dívida).

## Testes: o que cada um protege

| Teste                               | Risco que protege                                                                                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/api/errors.test.ts` (9) | mensagem genérica do backend vazando para o usuário; violações de campo perdidas; id do erro não exibido; erro de rede tratado como erro de API |
| `src/locales/locales.test.ts` (89)  | chave de tradução faltando em um dos quatro idiomas                                                                                             |

### O que NÃO está coberto

- **Nenhum teste de componente ainda**: o 404, o limite de erro e o carregamento
  sob demanda foram verificados no navegador, não por teste automatizado. A
  suíte de componentes e o Playwright são a fase 10.
- **O `queryClient`** não tem teste da política de retentativa.
- **`useLegalNamespace`** não tem teste; foi verificado abrindo `/termos`.

## Como verificar em produção

```bash
# O bundle de entrada não deve voltar a crescer para um arquivo único:
npm --prefix frontend run build | grep "index-"

# Nenhuma vulnerabilidade no que vai para o navegador:
npm --prefix frontend audit --omit=dev
```

## Dívida conhecida

- **Só 2 das 27 telas usam TanStack Query** (dashboard e progresso). As outras
  ainda buscam com `useEffect` + `useState`, sem cache nem invalidação. Migrar as
  restantes é a fase 10, junto com os formulários.
- **O layout feature-first do plano não foi feito.** As pastas continuam em
  `src/features`, `src/components`, `src/api`. O alias `@/` já existe, que era a
  pré-condição; mover os arquivos é um diff enorme sem ganho funcional imediato.
- **A entrada ainda tem 476 kB**, dominada por React, i18next e os bundles de
  tradução dos quatro idiomas. Separar por idioma exigiria reestruturar os 22
  arquivos de tradução, porque hoje cada um exporta `{ pt, en, es, fr }` junto.
- **`sonner` está montado e nenhuma página emite toast ainda.** O `Toaster` está
  no lugar; falta usá-lo.
- **`lucide-react` foi removido na fase 15.** Ele tinha sido instalado para
  trocar os SVGs duplicados por ícones prontos, e nunca foi importado. A lei das
  cores do design pede ícone próprio, não biblioteca genérica, então os SVGs
  ficam até o design novo chegar.
- **65 botões escritos à mão em 20 arquivos**, 38 deles repetindo o estilo
  primário, enquanto `components/ui/Button.tsx` existe e não é usado por
  ninguém. O componente é onde a lei das cores dos botões está escrita, então
  foi mantido e listado em `knip.json`; padronizar as telas é a fase 10.

## Histórico

- **2026-09-08**: fase 15 (limpeza). Removidos `Bar.tsx` e `ProgressRing.tsx`
  (sem uso; o segundo duplicava o `CalorieRing`, usado por três telas, e ainda
  cravava um hex fora dos tokens), a função `generateInvite` da API do par (a
  tela lê o código do `GET /pair`), o componente `Badge` e seus rótulos em
  português dentro do código, e os `export` de quatro funções internas do
  `PrivacyPage` e do `bundle` em `locales/index.ts`. Dependências fora:
  `lucide-react` e `@testing-library/user-event`. `knip` entrou no repositório
  com os falsos positivos configurados.
- **2026-09-06**: fase 9. Alias `@/`, código por rota, 404 real, limite de erro,
  helper único de erro, TanStack Query no dashboard e no progresso, textos legais
  sob demanda, react-router atualizado por vulnerabilidade. Entrada de 742,85 kB
  para 476 kB; avisos de lint de 10 para 8; testes de frontend de 89 para 98.
