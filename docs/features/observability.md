# Feature: observability and resilience

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-06

## What it is and where it lives

Three things that only matter once the application runs somewhere other than a
laptop: knowing which request a user is complaining about, seeing what the system
is doing without asking it, and surviving a partner API that is down.

|                   |                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| Frontend route    | none                                                                                           |
| Who can access it | operators, on the management port; the request id reaches every user in an error body          |
| Backend package   | `com.aps.vitalpair.shared.web`, `com.aps.vitalpair.shared.metrics`, `com.aps.vitalpair.config` |
| Feature flag      | none                                                                                           |

## Architecture

| Layer             | Files                                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Request id        | `shared/web/CorrelationIdFilter.java`, `shared/web/RequestContext.java`                                                                            |
| Error envelope    | `shared/web/ApiErrors.java`, `shared/web/ApiError.java`, `shared/web/JsonAuthenticationEntryPoint.java`                                            |
| Business metrics  | `shared/metrics/AiMetrics.java`                                                                                                                    |
| Resilience        | `application.yaml` (`resilience4j`), `ai/infrastructure/client/PlanAiGateway.java`, `nutrition/infrastructure/client/OpenFoodFactsHttpClient.java` |
| Scheduled jobs    | `config/SchedulingConfig.java`, `notification/application/scheduler/NotificationScheduler.java`, `db/migration/V24__create_shedlock.sql`           |
| Ports and logging | `application.yaml` (`management`), `application-prod.yaml` (ECS JSON), `application-dev.yaml` (pattern)                                            |

### Endpoints

| Method | Path                   | Port | Who can call it               |
| ------ | ---------------------- | ---- | ----------------------------- |
| GET    | `/actuator/health`     | 9090 | anyone who can reach the port |
| GET    | `/actuator/info`       | 9090 | anyone who can reach the port |
| GET    | `/actuator/prometheus` | 9090 | anyone who can reach the port |

Nothing under `/actuator` is served on 8080/8081 any more. The management port is
bound inside the container network and never mapped by the reverse proxy, which
is where access control for it lives; see the note under "Achados de segurança".

## Regras de negócio

- **Every request has an id, and the user sees it.** `X-Request-Id` is generated
  when absent, echoed in the response, put in the MDC so every log line carries
  it, and returned inside the error body. An id supplied by the caller is kept,
  so a chain of services shares one, but only if it is a short plain token:
  otherwise it is replaced, because the value goes into log lines and a response
  header, where an unchecked one lets a caller forge log entries.
- **The MDC is cleared when the request ends.** The thread returns to the pool;
  anything left behind would be attributed to the next person's request.
- **Errors are built in one place.** `ApiErrors` is the only construction site of
  `ApiError`, so a new field cannot be silently left null in four of five
  handlers, which is exactly how the request id would have gone missing.
- **Anthropic is never retried.** A repeat of a paid call that takes up to a
  minute doubles both cost and waiting, precisely when the partner is struggling.
  It has a circuit breaker instead.
- **Open Food Facts is retried only when the connection never opened.** A read
  timeout means the server answered and then went quiet; retrying that just
  multiplies the wait. Measured: three attempts on a stalled server made a search
  box take 15.6s, and listing `ResourceAccessException` as retryable still gave
  10.2s. Only `ConnectException` is retried now.
- **A model refusal is not an outage.** A refusal or an unparseable answer means
  the partner replied, so it must not count towards opening the breaker; a
  `PlanContentException` (and `MealPhotoContentException`) is ignored by the
  breaker while still answering 502 to the caller. Without the split, a handful
  of unusual prompts took plan generation down for everyone for a minute.
- **A scheduled job runs once per schedule, not once per instance.** ShedLock
  holds the lock in Postgres, so a second instance skips a job the first is
  running. With one instance it changes nothing; on the first rolling deploy it
  is the difference between one notification and two.
- **Job times are Brazil's, not the server's.** A production JVM in UTC would
  fire the 09:00 flash mission at 06:00 local and shift the reminder's idea of
  "today" into the middle of the night.

## Achados de segurança

### Corrigidos nesta fase

**O-1 (médio, corrigido): 401 devolvia página HTML do container.** O entry point
usava `sendError`, então um cliente que analisa `{success, message, data}` em
todo lugar recebia marcação HTML exatamente quando a sessão expirava, sem id para
relatar. Agora responde no mesmo envelope, com `requestId`. Provado por
`CorrelationIdIT.anUnauthenticatedRequestAnswersTheStandardEnvelopeWithAnId`.

### Verificados e OK

- **Métricas fora da porta pública.** `/actuator/prometheus` responde 404 na
  porta da API e 200 na 9090 (medido na aplicação rodando). Uma leitura ao vivo
  do sistema não fica exposta junto com a API.
- **`show-details: never` no health.** O detalhe nomeia banco, Redis e qual
  componente falhou, que é um mapa do sistema para quem estiver sondando.
- **Id do chamador validado.** Só letras, dígitos, hífen e sublinhado, no máximo
  64 caracteres; qualquer outra coisa é substituída, o que fecha injeção de log
  e de cabeçalho por esse caminho.
- **Sem dado pessoal no MDC.** Só ids de usuário e de par, nunca nome ou e-mail,
  porque log é arquivo que circula.

### Abertos

- **A porta de management não tem autenticação própria.** A proteção é de rede:
  a porta fica dentro do compose e o nginx nunca a mapeia. Isso vira uma
  configuração real na fase 11; até lá, não há servidor no ar.
- **Ciclos de arquitetura subiram de 3 para 6.** O `config` importa
  `auth.infrastructure.security` (o filtro JWT) enquanto `auth` importa
  `config.JwtProperties`; o ciclo já existia e ficou visível por mais caminhos
  quando `config` passou a importar `shared.web`. Movi o entry point para
  `shared.web`, o que reduziu o acoplamento mas não desfez o ciclo. Desfazer
  exige mover as `@ConfigurationProperties` para perto de quem as usa, que é um
  refactor por si só.

## Testes: o que cada um protege

| Teste                       | Risco que protege                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| `CorrelationIdIT` (7)       | falha impossível de rastrear; id forjado no log; contexto vazando entre requisições; 401 em HTML |
| `ManagementEndpointsIT` (5) | métricas na porta pública; métricas em lugar nenhum; chamada paga sem contador                   |
| `CircuitBreakerIT` (3)      | parceiro fora do ar segurando threads; recusa do modelo derrubando a feature para todos          |
| `SchedulerLockIT` (3)       | notificação duplicada por instância; job no fuso errado                                          |

### O que NÃO está coberto

- **Logs em JSON no perfil prod**: a configuração existe e o perfil sobe em
  `SwaggerDisabledInProdIT`, mas nenhum teste lê uma linha de log e confirma que
  é JSON válido com `requestId` dentro.
- **Meio-aberto do disjuntor**: o teste cobre fechado e aberto, não a transição
  de volta depois dos 60 segundos.
- **Duas instâncias de verdade disputando o lock**: o teste prova que o lock é
  tomado e continua válido, não que uma segunda JVM é barrada.
- **Métricas do Open Food Facts**: só as chamadas de IA são contadas.

## Como verificar em produção

```bash
# O id que o usuário relatou aparece no log:
grep '"requestId":"<id-do-usuario>"' /var/log/vitalpair/app.log

# Estado dos disjuntores (1 = está nesse estado):
curl -s localhost:9090/actuator/prometheus | grep resilience4j_circuitbreaker_state

# Chamadas de IA por tipo e resultado:
curl -s localhost:9090/actuator/prometheus | grep vitalpair_ai_requests_total
```

```sql
-- Quem está segurando o lock de cada job agendado:
SELECT name, locked_by, locked_at, lock_until FROM shedlock;
```

## Dívida conhecida

- A porta 9090 é aberta a quem alcança a rede; a fase 11 precisa garantir que o
  nginx não a mapeie, ou a proteção deixa de existir sem nenhum aviso.
- `AiMetrics.timed` envolve a chamada num `Supplier`, o que impede distinguir
  "falhou na chamada" de "falhou ao interpretar a resposta" nas métricas.

## Histórico

- **2026-09-06**: fase 8. Correlation id ponta a ponta, `ApiErrors` centralizada,
  entry point JSON, métricas de negócio e porta de management separada,
  disjuntores nas duas APIs externas com retentativa só onde faz sentido,
  ShedLock nos dois jobs e fuso fixo. 18 testes de integração novos (73 para 91);
  cobertura de linha 82,5% para 82,8%, ramo 53,4% para 54,3%.
