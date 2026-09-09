# Feature: frontend foundation

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped, partially applied (see "Dívida conhecida")
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-09

## What it is and where it lives

The shared parts of the React application: how code reaches the browser, how a
screen fetches data, how a form validates and sends, how an error is turned into
something a person can read, and what happens when a route does not exist or a
render throws.

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
| Forms                      | `src/shared/ui/form/{Field,TextField,NumberField,FormError}.tsx`; react-hook-form + zod, schema in the page    |
| Failure screens            | `src/shared/ui/NotFoundPage.tsx`, `src/shared/ui/AppErrorBoundary.tsx`, `src/shared/ui/RouteFallback.tsx`      |
| On-demand translations     | `src/locales/index.ts` (`loadLegalNamespace`), `src/shared/i18n/useLegalNamespace.ts`, `src/locales/errors.ts` |
| Providers                  | `src/App.tsx`                                                                                                  |
| Alias                      | `tsconfig.app.json` (`paths`), `vite.config.ts` and `vitest.config.ts` (`resolve.alias`)                       |
| Test harness               | `src/test/{setup.ts,render.tsx,fixtures.ts}`, `src/test/msw/{server.ts,api.ts}`                                |

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
  Phase 10a found two more pages reading the response by hand and moved them.
- **Every form validates before it sends, in the product's language.** The
  browser's own `required` and `type="email"` are bypassed trivially and their
  messages come in the browser's language, so every form sets `noValidate` and
  validates with a zod schema declared in the page. Constraints carry no text; the
  message is an i18n key attached at render time, in all four languages. Bounds
  mirror the backend's request records, so the person hears about a slip here
  rather than after a round trip. The server validates regardless; the schema is
  about the message, not the guarantee.
- **A form never sends a blank.** A zero step count, an empty weight, a workout
  with no measure and a whitespace invite code all used to reach the server, or
  vanish with no message. Now each is refused with a sentence next to the field.
- **A failed save is always shown.** Every submit handler catches and renders
  through `getApiErrorMessage`, so a person is never left believing something was
  saved when it was not.
- **The contact form hands the message to the mail client.** There is no endpoint
  for it, and a public one that sends e-mail is a spam relay until it has rate
  limiting and a challenge in front of it. `mailto:` means the message actually
  leaves, and no server of ours can be abused to send it.
- **An unknown path shows a 404.** Every unknown path used to redirect to the
  dashboard, which sends a logged-out visitor to the login screen for no stated
  reason and hides a broken link behind what looks like a working one.
- **A render error shows the request id** when the error carries one, so a report
  from a user points straight at the server log line (see `observability.md`).

## Achados de segurança

### Corrigidos na fase 9

**F-1 (alto, corrigido): react-router com vulnerabilidade conhecida.**
`react-router` 7.18.0 estava sujeito a [GHSA-qwww-vcr4-c8h2], bypass de CSRF em
modo RSC. O projeto não usa RSC, então o impacto prático era nulo, mas era uma
dependência de produção vulnerável. Atualizado para 7.18.3; `npm audit
--omit=dev` passou de 2 vulnerabilidades altas para zero (medido).

### Corrigidos na fase 10a

**F-2 (médio, corrigido): o formulário de contato descartava a mensagem.**
`ContactPage.tsx` mostrava "Mensagem recebida" para uma mensagem que não era lida
em lugar nenhum: os campos não eram controlados e o `onSubmit` só trocava o
estado. Um comentário no código admitia. Agora valida os três campos e abre o
cliente de e-mail do visitante com assunto e corpo preenchidos, e o texto de
confirmação diz isso.

**F-3 (médio, corrigido): salvar peso no perfil não tinha `catch`.**
`ProfilePage.tsx` chamava `recordWeight` num `try/finally` sem `catch`. Uma
falha do servidor virava rejeição sem tratamento e a pessoa não via nada,
acreditando que o peso tinha sido salvo. A cópia da mesma tela em
`ProgressPage.tsx` tratava. As duas viraram um componente só, `WeightForm`.

**F-4 (baixo, corrigido): peso sem limite superior em duas telas.** Nada impedia
registrar 1000 kg, que desenhava um pico no gráfico. O formulário aceita agora de
20 a 500 kg, o mesmo limite do perfil. O servidor aceita até 999,99 (ver
"Abertos").

**F-5 (baixo, corrigido): `NaN` no corpo da requisição.** `toNumber` em
`ActivityPage.tsx` devolvia `Number("abc")` sem checar. Um campo numérico agora
chega como número ou como ausente, nunca como `NaN`.

**F-6 (baixo, corrigido): treino vazio virava registro.** O formulário de treino
não tinha guarda nenhuma; submeter em branco gravava uma atividade com todas as
medidas nulas, que aparecia na lista do dia valendo zero calorias. Agora exige ao
menos uma medida. O servidor ainda aceita (ver "Abertos").

**F-7 (baixo, corrigido): "Erro de validação" mostrado ao usuário.**
`PairPage.tsx` e `ProfilePage.tsx` liam `err.response.data.message` na mão e
mostravam o texto genérico do backend, que `errors.ts` já filtrava. Trocado pelo
helper.

**F-8 (baixo, corrigido): três `return` silenciosos.** Passos com zero, peso com
zero e peso vazio saíam do handler sem mensagem: a pessoa clicava e nada
acontecia. Cada caso tem uma frase agora.

### Corrigidos em 09/09

**F-9 (baixo, corrigido): o nome acessível do sino mudava sozinho.** O `<span>`
do contador fica dentro do `<button>`, então o texto dele entrava no nome
acessível: o controle se anunciava como "Notificações 2" num momento e
"Notificações" no outro, conforme o número chegava e era zerado. Nome que se
mexe com o dado é alvo móvel pra quem navega por nome.

O botão passou a ter `aria-label` fixo, que vence o conteúdo, e o contador é
anunciado por `aria-describedby`, onde ele é detalhe e não identidade. Ganhou
também `aria-expanded`, que faltava num controle que abre painel.

Descoberto porque o teste de componente não conseguia achar o botão pelo nome
depois que a contagem chegava, que é exatamente o que a tecnologia assistiva
enfrenta. Provado: removendo o `aria-label`, 2 dos 6 testes caem.

### Verificados e OK

- **Nenhuma vulnerabilidade de produção**: `npm audit --omit=dev` retorna zero.
  As 4 restantes são de ferramentas de build (`brace-expansion`, `browserslist`,
  `nanoid`, `postcss`), que não vão para o navegador do usuário. Medido de novo
  após instalar `msw`: continua zero.
- **Os limites do cliente batem com os do servidor**: nome 1 a 100, altura 50 a
  300, peso do perfil 20 a 500, nascimento no passado, passos inteiro positivo,
  medidas de treino não negativas, código de convite com 8 caracteres do alfabeto
  de `AuthService`. Conferido registro a registro em `UpdateProfileRequest`,
  `LogActivityRequest`, `RecordWeightRequest` e `AuthService.generateInviteCode`.
- **O `mailto:` não injeta parâmetro**: assunto e corpo passam por
  `encodeURIComponent`, então `&`, `?` e quebra de linha viram escapes e a mensagem
  não consegue acrescentar um `cc=` ou `bcc=` à URL.
- **Sem token em armazenamento**: a fase 6 já tinha movido o refresh para cookie
  HttpOnly; nada nesta fase reintroduz credencial em `localStorage`.
- **Sem HTML cru**: nenhum `dangerouslySetInnerHTML` foi adicionado.
- **O id de erro exibido não é dado sensível**: é um UUID gerado pelo servidor,
  sem relação com o usuário.

### Abertos

- **`RecordWeightRequest` aceita até 999,99 kg** enquanto `UpdateProfileRequest`
  limita a mesma grandeza a 500. O cliente agora usa 20 a 500 nas duas telas, mas
  uma chamada direta à API ainda grava 3 kg. A mudança é no backend e pertence à
  feature de progresso (registrada como P-4 em `progress.md`).
- **`LogActivityRequest` aceita todas as medidas nulas.** O cliente exige uma;
  uma chamada direta ainda grava a linha vazia. Falta uma validação cruzada no
  servidor, com teste.
- **Não existe endpoint de contato.** O `mailto:` é o caminho honesto até haver
  um, e um endpoint público que envia e-mail precisa de rate limit e desafio antes
  de existir.
- **Nenhum aviso de lint em aberto.** Eram 9 no início da fase 10a e 8 depois
  dela, todos `react-hooks/set-state-in-effect` nos arquivos que buscavam dados
  com `useEffect`. A fase 10b migrou os seis restantes e zerou a conta.

## Testes: o que cada um protege

| Teste                                             | Risco que protege                                                                                                                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/api/errors.test.ts` (9)               | mensagem genérica do backend vazando para o usuário; violações de campo perdidas; id do erro não exibido; erro de rede tratado como erro de API                                 |
| `src/locales/locales.test.ts` (89)                | chave de tradução faltando em um dos quatro idiomas                                                                                                                             |
| `src/features/progress/ProgressPage.test.tsx` (5) | peso vazio, zero ou 1000 enviado ao servidor (F-4, F-8); peso válido enviado como número e gráfico recarregado; falha do servidor invisível                                     |
| `src/features/profile/ProfilePage.test.tsx` (6)   | falha ao salvar peso invisível (F-3); nome vazio, altura fora de 50 a 300 e sexo ausente enviados; mensagem do sexo longe do campo; corpo do PUT com números como números       |
| `src/features/activity/ActivityPage.test.tsx` (7) | zero ou nenhum passo enviado sem mensagem (F-8); treino sem medida gravado (F-6); distância negativa enviada; botões rápidos somando errado; corrida enviada com só a distância |
| `src/features/pair/PairPage.test.tsx` (5)         | código em branco ou fora do formato enviado; código não normalizado; "Erro de validação" mostrado (F-7); mensagem específica do servidor perdida                                |
| `src/features/legal/ContactPage.test.tsx` (3)     | mensagem descartada com confirmação falsa (F-2); campos vazios ou e-mail inválido aceitos; assunto e corpo do `mailto:` sem os dados                                            |

Cada recusa é provada duas vezes: a mensagem está na tela e a requisição não
saiu. Um handler do MSW grava cada corpo recebido e o teste afirma que a lista
está vazia. Só a mensagem passaria com um formulário que mostra o texto e envia
mesmo assim.

**Prova de que não são vazios** (2026-09-08): três sabotagens plantadas ao mesmo
tempo, cada uma num arquivo. Sem os limites do peso, sem a regra de "ao menos
uma medida" e com a leitura crua do erro no par, caíram exatamente os 5 testes
que guardam essas regras e os outros 18 do lote continuaram verdes. Antes da
migração, 23 dos 26 testes novos falhavam contra as páginas antigas; os 3 que
passavam eram caminhos felizes que nunca estiveram quebrados.

Como rodar: `npm --prefix frontend test`. O harness força `pt` (o jsdom se
declara `en-US`), desliga retentativas do TanStack Query e falha qualquer
requisição sem handler registrado, para que um teste nunca passe por resposta
deixada por outro.

### O que NÃO está coberto

- **Os formulários de onboarding e de refeição** não foram migrados nem testados.
  São 5 e 4 inputs sem elemento `<form>`, dentro de arquivos de 817 e 942 linhas;
  migrar antes de decompor seria tocar duas vezes. Fase 10b.
- **Escolher uma opção no `Select` ou uma data no `DateField` por dentro de um
  teste**: os testes do perfil usam um perfil já preenchido. O caminho
  `Controller` → `Select` é exercido só pelo caso "sexo ausente".
- ~~**`ProtectedRoute`, `NotificationsBell` e `CalorieRing`** continuam sem teste
  de componente.~~ Feitos em 09/09: 14 testes ao todo, cada grupo provado
  não-vacuoso quebrando o componente de propósito.
- ~~**Nenhum teste de navegador de fluxo de negócio**~~ Feito em 09/09:
  `onboarding.spec.ts` percorre os cinco passos até o dashboard e
  `nutrition.spec.ts` registra uma refeição e a lê de volta na lista do dia.
  Convite → aceite continua sem percurso, porque exige um segundo contexto de
  navegador.
- **O `queryClient`** não tem teste da política de retentativa.
- **`useLegalNamespace`** é exercido indiretamente pelo teste de contato, que
  espera o namespace carregar; não tem teste próprio.

## Como verificar em produção

```bash
# O bundle de entrada não deve voltar a crescer para um arquivo único:
npm --prefix frontend run build | grep "index-"

# Nenhuma vulnerabilidade no que vai para o navegador:
npm --prefix frontend audit --omit=dev

# Todo arquivo com <form> usa react-hook-form (as duas listas devem ser iguais):
grep -rl "<form" frontend/src --include="*.tsx" | grep -v test | sort
grep -rl "<form" frontend/src --include="*.tsx" | grep -v test | xargs grep -l useForm | sort
```

## Aviso de falha do servidor

`shared/api/notifyServerFailure.ts`, chamado pelo interceptor de resposta do
axios, que é o único lugar por onde todo 5xx passa.

Avisa **só** quando o servidor falhou: 5xx, ou nenhuma resposta (offline, DNS,
servidor fora). Um 400 ou 422 é assunto da tela, que põe a mensagem do lado do
campo; um toast por cima diria a mesma coisa duas vezes. Um 401 é tratado pela
renovação e, quando ela também falha, pela ida pro login, que é mais alto que
qualquer toast.

**O código do erro é o motivo de existir.** Sem ele, alguém dizendo "quebrou"
deixa a gente casando um horário aproximado com o log; com ele a linha aparece na
hora. A mesma falha não empilha duas vezes: uma tela quebrada dispara várias
requisições, e quatro toasts idênticos são ruído.

### Verificado

- `notifyServerFailure.test.ts` (6): mostra o código no 5xx; cala no 4xx e no
  401; fala quando não houve resposta; não empilha repetida; ainda reporta uma
  segunda falha diferente. Provado não-vacuoso trocando a condição por `true`,
  que derruba 2 dos 6.
- `e2e/errors.spec.ts` (1): o toast **aparece na tela de verdade**, com o código
  visível. O teste unitário mocka o `sonner`, então sozinho ele não provaria nada
  disso: um `Toaster` montado e nunca alimentado passaria nele, que era exatamente
  o estado do app antes.

## Dívida conhecida

- ~~**9 telas ainda buscam com `useEffect`**~~ Zerado em 09/09. As nove restantes
  (gamificação, plano alimentar, missões, convite, par, temporada, fim de
  temporada, configurações e plano de treino) foram para o TanStack Query.
  Sobraram três `useEffect` no `src/features`, e nenhum busca dado: trava de
  rolagem e tecla Esc no modal de refeição, o atraso de digitação da busca, e a
  contagem regressiva da missão relâmpago.
- **14 telas acima de 300 linhas**, contadas em 09/09. O número não mudou porque
  onboarding continua acima do limite, só que bem menor. Nutrição caiu de 944 para
  640 com as três abas extraídas; onboarding, que era a maior com 834, caiu para
  404 com os cinco passos, as peças de apresentação e os ícones em arquivos
  próprios. As duas continuam acima do limite.
- **`OnboardingPage` ainda tem 404 linhas** e não tenho intenção de forçá-la
  abaixo de 300 quebrando mais. O que sobrou é o fluxo: o estado dos cinco
  passos, `goNext`, o salvamento com cálculo de meta, a entrada no par e o
  rodapé. Isso é uma unidade só; separar em dois arquivos que leem o mesmo estado
  deixaria o número bonito e o código pior. O `max-lines` continua como aviso, e
  este é um dos casos em que o aviso é a resposta certa.
- **O layout feature-first do plano não foi feito.** As pastas continuam em
  `src/features`, `src/components`, `src/api`. O alias `@/` já existe, que era a
  pré-condição; mover os arquivos é um diff enorme sem ganho funcional imediato.
- **A entrada tem 474,04 kB**, dominada por React, i18next e os bundles de
  tradução dos quatro idiomas. Foi a 480,88 kB com os formulários da fase 10a e
  encolheu de volta na 10b, porque cada tela migrada deixou de carregar o estado
  que mantinha à mão. Separar por idioma exigiria reestruturar os 22 arquivos de
  tradução, porque hoje cada um exporta `{ pt, en, es, fr }` junto.
- ~~**`sonner` está montado e nenhuma página emite toast ainda.**~~ Pago em
  2026-09-09, ver abaixo.
- **`lucide-react` foi removido na fase 15.** Ele tinha sido instalado para
  trocar os SVGs duplicados por ícones prontos, e nunca foi importado. A lei das
  cores do design pede ícone próprio, não biblioteca genérica, então os SVGs
  ficam até o design novo chegar.
- **`@testing-library/user-event` saiu na fase 15 e voltou na 10a.** A remoção
  estava certa quando foi feita: naquele momento nada o importava. Os testes de
  componente desta fase o usam, então ele voltou junto com eles.
- **65 botões escritos à mão em 20 arquivos**, 38 deles repetindo o estilo
  primário, enquanto `components/ui/Button.tsx` existe e não é usado por
  ninguém. O componente é onde a lei das cores dos botões está escrita, então
  foi mantido e listado em `knip.json`; padronizar as telas é a fase 10b.
- **`ProfilePage.changeGoal` reenvia o perfil inteiro com `sex` e
  `activityLevel` por cast**, sem checar nulo. Se o perfil ainda não tem esses
  campos, o PUT falha com 400 e a tela mostra "não consegui trocar o objetivo".
  Não é o formulário; ficou como estava.

## Histórico

- **2026-09-09**: as nove telas que ainda buscavam com `useEffect` foram para o
  TanStack Query. `season` e `missions.flash` passaram a ser lidas pela mesma
  chave que o dashboard e o perfil já usavam, então as telas não podem mais
  discordar sobre qual temporada está rolando. O botão de exercício e as chaves de
  notificação mantiveram o comportamento otimista, agora com snapshot para
  desfazer quando o pedido falha, no lugar de um segundo GET que engolia o próprio
  erro.

- **2026-09-09**: testes de componente que faltavam. `ProtectedRoute` (3),
  `NotificationsBell` (6) e `CalorieRing` (5). O do sino achou F-9. Testes de
  frontend: 153 para 167.
- **2026-09-09**: o que faltava da fase 9. O `sonner` estava montado sem ninguém
  emitir toast; passou a avisar falha do servidor com o código da requisição, que
  era o que o plano da fase pedia. 6 testes unitários e 1 de navegador.
- **2026-09-08**: fase 10b (dados e decomposição). Sete telas mais o sino do
  cabeçalho saíram do `useEffect` para o TanStack Query, e os 8 avisos de lint
  foram a zero: eram o sintoma exato desse padrão. Cada migração corrigiu um
  defeito próprio, não só a forma. Nutrição perdeu a corrida da busca (uma
  resposta atrasada sobrescrevia a atual), o favorito que ficava vazio para sempre
  depois de uma falha, e o `delete` sem `catch`. O feed parou de jogar fora as
  páginas já carregadas a cada reação. O sino trocou o intervalo escrito à mão por
  polling da query. A verificação de e-mail trocou a trava por `ref`, que existia
  porque o modo estrito gastava o token duas vezes, pela deduplicação da query.
  As três abas da nutrição viraram arquivos próprios: a tela caiu de 944 para 640
  linhas. Testes de 135 para 143; entrada de 480,88 para 474,04 kB.
- **2026-09-08**: fase 10a (formulários e testes de componente). Os 5 arquivos
  com `<form>` que faltavam (atividade, contato, par, perfil, progresso) passaram
  para react-hook-form + zod, com 21 chaves de mensagem novas em 4 idiomas. Sete
  achados corrigidos (F-2 a F-8), o pior sendo o contato que descartava a
  mensagem. `WeightForm` substitui duas cópias. `NumberField` e `Field` ganharam
  `error`; `Select` e `DateField`, `aria-invalid`. `RegisterPage` trocou `watch`
  por `useWatch`. MSW 2.15 entrou com harness em `src/test/`;
  `vitest.config.ts` ganhou o alias `@/` que faltava e que impedia qualquer teste
  de página. Testes de 98 para 124; avisos de lint de 9 para 8; `tsc` e build
  limpos.
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
