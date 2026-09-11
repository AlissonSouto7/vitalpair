# Feature: the user's day

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-09

## What it is and where it lives

Everything the product calls "today" is a question about one person's day: the
meals on the day's list, the totals on the dashboard, the bar on the progress
chart, the streak, the weekly scoreboard. This feature decides where that day
starts and ends.

The answer is a per-user preference, stored as an IANA time zone identifier.

|                   |                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Frontend route    | `/profile` (the field), every screen that shows a day (the effect)                         |
| Who can access it | the signed-in person, for their own account only                                           |
| Backend package   | `user` (the preference), `nutrition` / `activity` / `progress` / `dashboard` (the readers) |
| Feature flag      | none                                                                                       |

## Architecture

| Layer       | Files                                                                               |
| ----------- | ----------------------------------------------------------------------------------- |
| Migration   | `V27__users_time_zone.sql`                                                          |
| Domain      | `user/domain/model/UserTimeZones.java`, `User.zone()`, `shared/time/DayWindow.java` |
| Port        | `user/domain/port/in/UserDayUseCase.java`                                           |
| Service     | `user/application/service/UserDayService.java`                                      |
| Validation  | `user/infrastructure/web/ValidTimeZone.java`                                        |
| Persistence | `user/infrastructure/persistence/UserPersistenceMapper.java` (String ↔ ZoneId)      |
| Frontend    | `frontend/src/features/profile/TimeZoneField.tsx`                                   |

| Endpoint           | Method | What it does                                    | Who       |
| ------------------ | ------ | ----------------------------------------------- | --------- |
| `/api/v1/users/me` | GET    | returns `timeZone` with the rest of the profile | the owner |
| `/api/v1/users/me` | PUT    | accepts an optional `timeZone`                  | the owner |

Every endpoint that takes an optional `date` (`/nutrition/logs`,
`/nutrition/summary`, `/activity`, `/activity/summary`, `/dashboard`) resolves
"no date given" to today in the caller's zone.

### How to run

```bash
./mvnw verify                                  # includes DayBoundaryIT
./mvnw failsafe:integration-test -Dit.test=DayBoundaryIT
npm --prefix frontend test                     # TimeZoneField
```

## Regras de negócio

- **O dia é do usuário, não do servidor.** O fuso do servidor é um acidente de
  onde ele roda. Nada no código pergunta que horas são "aqui".
- **Identificador da IANA, não deslocamento.** Deslocamento não sabe horário de
  verão, e o Brasil já teve e pode voltar a ter.
- **Janela meio aberta**: início incluído, fim excluído. Fim fechado precisaria
  de 23:59:59.999999999, que ou perde a última fração de segundo ou conta ela
  duas vezes, dependendo da precisão da coluna.
- **Ausente significa "não mexe".** O `timeZone` é o único campo opcional do
  formulário de perfil: um cliente que não conhece o campo não pode zerar a
  preferência de ninguém como efeito colateral de salvar o peso.
- **A sugestão do navegador nunca é aplicada sozinha.** Quem viaja uma semana
  não pode ter a virada do dia movida sem dizer nada; o app oferece, a pessoa
  decide.
- **O dia é derivado, nunca gravado.** Trocar o fuso muda a que dia pertencem as
  refeições já registradas. É o comportamento honesto: o instante é o fato, o dia
  é uma leitura dele.
- **Fuso desconhecido na leitura cai no padrão e é logado.** Identificadores são
  aposentados de vez em quando, e uma atualização de JDK basta pra órfã um. Falhar
  ali deixaria a conta ilegível, derrubando o login e todas as telas, por causa de
  uma preferência.

## Achados de segurança

### Corrigidos nesta fase

**D-1 (alto, corrigido): a refeição sumia da lista do dia.** O controller
perguntava `LocalDate.now()` no fuso da JVM, e o adaptador transformava essa data
numa janela fixa em UTC. As duas pontas só concordavam quando os dois fusos
concordavam.

Medido em UTC-3, com o teste de navegador: a refeição salvava com `201` e a lista
recarregada voltava vazia.

```
POST 201 /api/v1/nutrition/logs {"foodName":"Arroz com feijão","caloriesKcal":260,...}
GET  200 /api/v1/nutrition/logs {"data":[]}
```

Na prática, das 21:00 à meia-noite, todo dia, no horário do Brasil, a refeição
registrada desaparecia da lista na hora. Três horas por dia, no horário do jantar.

Em produção a JVM roda em UTC e as duas pontas voltam a concordar, então o
sintoma some e o erro troca de forma: o "dia" vira o dia UTC e quem janta às
21:00 tem a refeição contada no dia seguinte. O prato continua no lugar errado e
ninguém vê.

**D-2 (médio, corrigido): o mesmo par em outras três features.** `activity`,
`progress` e `dashboard` tinham exatamente a mesma combinação. Encontrados por
grep de `LocalDate.now()` sem fuso e de `ZoneOffset.UTC`, depois que D-1 apontou o
padrão.

**D-3 (médio, corrigido): o evento de pontuação carregava o dia errado.**
`MealLoggedEvent` e `ActivityLoggedEvent` derivavam a data com
`atZone(ZoneOffset.UTC)`. Essa data é a chave da sequência (streak), das missões e
do placar semanal, então uma refeição das 21:00 pontuava no dia seguinte e podia
quebrar uma sequência que a pessoa não quebrou.

**D-4 (baixo, corrigido): o gráfico de progresso agrupava no fuso do banco.** O
agrupamento por dia acontecia dentro do SQL com `CAST(loggedAt AS LocalDate)`, que
usa o fuso da sessão do banco. Passou a ser `AT TIME ZONE :zone`, com o fuso
ligado como parâmetro.

### Verificados e OK

- **O fuso é validado no servidor**, com `ZoneId.of` via `@ValidTimeZone`, não com
  regex nem com lista fixa: o que importa é se o servidor consegue resolver o
  nome. Um fuso inventado responde 400.
- **O parâmetro `:zone` da query nativa é ligado, não interpolado**, então não
  carrega SQL. Testado com `Mars/Olympus_Mons`, que é recusado antes de chegar no
  banco.
- **Escopo por dono mantido**: `findByUserAndDay` continua recebendo o `userId`
  explícito. A janela não carrega dono, e trocar a assinatura por só a janela teria
  perdido o filtro.
- **Ninguém lê o fuso de outra pessoa**: o `UserDayUseCase` só é chamado com o id
  do próprio autenticado, e `TenantIsolationIT` (30 testes) continua verde.
- **Preferência não é dado sensível**: fuso não identifica ninguém sozinho e não
  vai pra log a não ser quando é inválido, caso em que o valor recusado é o
  próprio problema.

### Abertos

- **O fuso não entra no JWT**, então cada endpoint que resolve "hoje" faz uma
  leitura do usuário. Onde o serviço já carregava o usuário (nutrition, progress)
  não custa nada; onde não carregava (activity, dashboard) é uma consulta a mais
  por request. Colocar no token traria o problema oposto: o valor ficaria velho
  por até 15 minutos depois de a pessoa trocar.

## Testes: o que cada um protege

| Teste                                | Risco que protege                                                                                                                                                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DayBoundaryIT` (9)                  | refeição da noite sumindo da lista; total do dia divergindo da lista; duas pessoas em fusos diferentes; troca de fuso; sem data; fuso inválido; fuso ausente zerando a preferência; conta nova sem fuso; barra do gráfico no dia errado |
| `UserProfileServiceTest` (+2)        | salvar o peso mexendo no fuso sem querer                                                                                                                                                                                                |
| `TimeZoneField.test.tsx` (3)         | aviso que não aparece; aviso aplicado sozinho; navegador que não informa o fuso                                                                                                                                                         |
| `nutrition.spec.ts` (1)              | o percurso completo no navegador: registrar e ver na lista                                                                                                                                                                              |
| `TenantIsolationIT` (30, já existia) | a query nativa nova vazando dado de outro par                                                                                                                                                                                           |

Prova vermelho para verde: com o bug original reintroduzido (`DayWindow.of(date,
ZoneOffset.UTC)` e `LocalDate.now()` no controller), `DayBoundaryIT` falha 5 de 8.
Com a correção, 9 de 9 passam. O teste do gráfico foi provado não-vacuoso à parte,
fixando `"UTC"` na query: falha só ele.

### O que NÃO está coberto

- **Horário de verão**: `DayWindow.of` usa `atStartOfDay(zone)`, que já lida com o
  dia em que a meia-noite não existe, mas nenhum teste exercita uma data assim.
  O Brasil não tem horário de verão hoje, então o risco é de quem estiver em
  outro país.
- **Fuso órfão na leitura**: o `catch` que cai no padrão não tem teste, porque
  forjar um identificador que o JDK conhecia e não conhece mais exigiria mexer na
  base de fusos da JVM.
- **Sequência e missões**: D-3 corrigiu a data que o evento carrega, mas os testes
  de sequência continuam usando datas fixas e não exercitam a virada.

## Como verificar em produção

```sql
-- distribuição de fusos, pra saber se o padrão ainda serve
SELECT time_zone, count(*) FROM users WHERE deleted_at IS NULL GROUP BY 1 ORDER BY 2 DESC;

-- refeições nas três horas que costumavam sumir, no fuso de quem registrou
SELECT u.email, f.logged_at, (f.logged_at AT TIME ZONE u.time_zone)::date AS dia
FROM food_logs f JOIN users u ON u.id = f.user_id
WHERE (f.logged_at AT TIME ZONE u.time_zone)::time >= '21:00'
ORDER BY f.logged_at DESC LIMIT 20;
```

## Dívida conhecida

- **Não há seletor de fuso completo**, só o valor atual e a sugestão do navegador.
  Quem quiser um fuso que não é o do aparelho não consegue escolher pela tela.
- **O fuso do par não é considerado em nada compartilhado.** `SeasonService:48`,
  `WeeklyMissionService:52` e `MissionService:96` usam `ZoneId.systemDefault()`,
  herdado das fases anteriores. Em 11/09 isso deixou de ser teórico: com a JVM em
  UTC (o runner da CI), quatro testes de integração caíram entre 21h e meia-noite
  de Brasília, porque a temporada começava "amanhã" e os pontos da noite ficavam
  antes dela. Registrado como S-7 em `season.md`; a JVM do backend e a dos testes
  passaram a rodar no fuso da casa (`America/Sao_Paulo`), o que resolve para quem
  está no Brasil e não resolve a pergunta de produto. Com os dois no Brasil dá no mesmo; com um par
  internacional, a semana de um não é a do outro. Fica registrado como dívida, não
  corrigido aqui, porque "de quem é a semana de um par" é uma decisão de produto e
  não de código. Note que `systemDefault()` é o fuso do servidor, ou seja, UTC em
  produção: são os mesmos três lugares que precisam de decisão antes de haver
  usuário fora do Brasil.

## Histórico

- **2026-09-09**: fuso por usuário. `V27`, `UserDayUseCase`, `DayWindow`, campo no
  perfil. Achados D-1 a D-4 corrigidos, com prova vermelho para verde.
  Descoberto pelo teste de navegador de registrar refeição, escrito na fase 10.
