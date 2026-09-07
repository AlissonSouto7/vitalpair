# Feature: automated test suite

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-06

## What it is and where it lives

The backend has two test layers. Unit tests (`*Test`) exercise a class with its
collaborators mocked and run on `mvn test`. Integration tests (`*IT`) boot the
whole application on a random port against real Postgres, Redis and SMTP in
containers, with WireMock standing in for Anthropic and Open Food Facts, and run
on `mvn verify`.

The split exists because the three most damaging bugs found in this codebase
were all invisible to unit tests: a Feign proxy that could not reach a
package-private type, a servlet filter registered twice, and a migration that
added a NOT NULL column no adapter wrote to. Each of them needs a request
crossing the real stack to show up.

|                   |                                                  |
| ----------------- | ------------------------------------------------ |
| Frontend route    | none                                             |
| Who can access it | developers and CI                                |
| Backend package   | `com.aps.vitalpair.support` (shared scaffolding) |
| Feature flag      | none                                             |

## Architecture

| Layer               | Files                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Build               | `pom.xml`: `maven-surefire-plugin` (`*Test`), `maven-failsafe-plugin` (`*IT`), `jacoco-maven-plugin` (shared exec file) |
| Test profile        | `src/test/resources/application-test.yaml`                                                                              |
| Containers          | `support/TestcontainersConfiguration.java` (Postgres 16, Redis 7), `support/MailpitSupport.java` (Mailpit)              |
| External APIs       | `support/WireMockSupport.java`, fixtures in `src/test/resources/wiremock/__files/`                                      |
| Integration base    | `support/AbstractIntegrationTest.java`                                                                                  |
| Slice base          | `support/ControllerSliceTest.java`                                                                                      |
| Test authentication | `support/security/WithVitalPairUser.java` + its context factory                                                         |

### How to run

```bash
./mvnw test                                  # unit tests only, no Docker
./mvnw verify                                # everything, including *IT
./mvnw verify -Dit.test=TenantIsolationIT    # one integration test
```

Docker must be running. The first execution pulls `postgres:16-alpine`,
`redis:7-alpine` and `axllent/mailpit:v1.31.1`.

## Regras de negócio (the rules this scaffolding enforces)

- **The test profile layers over the real configuration, it does not replace it.**
  `application-test.yaml` used to shadow `application.yaml` entirely, so a broken
  property in the main file could pass the whole suite and only fail when the
  packaged application started.
- **Containers win over any local configuration.** A developer's `.env` is read
  by spring-dotenv during tests too; every value it could inject is overridden,
  and `SchemaValidationIT` asserts the JDBC connection is the container's.
- **A real key must never reach a test.** The Anthropic key in the test profile
  is the literal `test-api-key`, and `AnthropicPlanGenerationIT` asserts the
  stub received exactly that.
- **Integration tests share one application context.** State that leaks between
  them is reset in `AbstractIntegrationTest.isolateFromPreviousTests()`: WireMock
  stubs and the Redis rate-limit counters, since every test calls from 127.0.0.1.
- **Slice tests import the real `SecurityConfig`.** Without it a `@WebMvcTest`
  falls back to Spring Boot's stock security, which enables CSRF; every POST then
  answers 403 and the test either passes for the wrong reason or needs a CSRF
  token the real API never requires.
- **WireMock fixtures are captured responses, not inventions.** The Anthropic and
  Open Food Facts bodies under `wiremock/__files/` came from the live APIs. When
  an upstream changes shape, the fixture is what has to be re-captured.

## Achados de segurança

### Corrigidos nesta fase

**T-1 (crítico, corrigido): plano de IA quebrado e sem escopo de tenant.**
`V22__ai_plans_tenant_id.sql` tornou `tenant_id` NOT NULL em `meal_plans` e
`workout_plans`, mas nenhum adaptador gravava a coluna. Impacto medido: `POST
/api/v1/meal-plan/generate` e `POST /api/v1/workout-plan/generate` respondiam
500 desde 2026-09-05 (reproduzido no backend da demo antes da correção). Não
apareceu antes porque nenhum plano foi gerado após a migration (`select count(*)
from meal_plans` = 0). Além da falha, as leituras filtravam apenas por
`user_id`, então a proteção que a migration pretendia criar não existia.
Correção: `tenantId` passa a atravessar modelo de domínio, portas, serviços e
controllers; as consultas usam `findByUserIdAndTenantIdAndWeekStart`; a troca de
refeição usa `findByIdAndPlanId`, de modo que um id de item de outro usuário não
encontra nada. Provas: `AnthropicPlanGenerationIT.aGeneratedPlanIsStoredWithItsTenant`
(vermelho antes, verde depois) e `TenantIsolationIT.theMealPlanBelongsToThePairThatGeneratedIt`.

### Verificados e OK

- **Isolamento entre pares em 21 leituras autenticadas** (`TenantIsolationIT`),
  além de tentativas de escrita cruzada: apagar log alimentar de outro par,
  reagir a item de feed alheio, marcar exercício de outro usuário e entrar num
  par já formado com o código lido direto do banco.
- **Rotação e replay de refresh token** ponta a ponta, incluindo a revogação da
  família inteira e a limpeza do cookie no logout (`AuthFlowIT`).
- **Enumeração de contas**: `forgot-password` responde igual para e-mail
  existente e inexistente, e nenhuma mensagem é entregue ao segundo.
- **Rate limit** aplicado uma única vez na cadeia, por IP no login e por usuário
  na geração de planos, com envelope e `Retry-After` corretos (`RateLimitIT`).
- **Swagger desligado em produção** e ligado em desenvolvimento
  (`SwaggerDisabledInProdIT`, `DevProfileIT`).
- **Cookie de refresh** com `HttpOnly`, `SameSite=Strict`, `Path=/api/v1/auth` e
  `Secure` em produção, sem `Secure` em desenvolvimento (senão a sessão nunca
  funcionaria sobre http).
- **Falhas de API externa** (529, recusa, timeout, conexão derrubada, JSON
  inválido) viram 502 tratado, nunca 500, e não gravam plano parcial.

### Abertos

- **`ai` sem testes unitários.** A feature é coberta por integração ponta a
  ponta, não por testes de unidade dos serviços. Aceitável por ora: o valor
  estava no caminho real, que é onde os bugs apareceram.
- **Seis ciclos entre features** continuam congelados no store do ArchUnit.
- **Divergência do dia da temporada** entre dashboard ("DIA 7/7") e tela de
  temporada ("DIA 1/30") permanece não investigada; nenhum teste desta fase a
  cobre.

## Testes: o que cada um protege

| Teste                            | Risco que protege                                                                                                     |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `AuthFlowIT` (12)                | sessão de navegador quebrada, token roubado renovável, e-mail de verificação/reset não entregue, enumeração de contas |
| `TenantIsolationIT` (30)         | vazamento de dados entre pares em qualquer leitura ou escrita                                                         |
| `AnthropicPlanGenerationIT` (13) | integração paga quebrada, 500 em falha do parceiro, gasto sem perfil completo, plano não persistido                   |
| `OpenFoodFactsSearchIT` (7)      | busca de alimento derrubando a tela quando a API pública falha ou trava                                               |
| `RateLimitIT` (4)                | força bruta em login, conta estourando o custo da IA                                                                  |
| `SchemaValidationIT` (3)         | migration faltando, entidade fora de sincronia com o banco, teste apontando para o banco do desenvolvedor             |
| `DevProfileIT` (2)               | erro de YAML no perfil que todo mundo roda, cookie `Secure` quebrando o login local                                   |
| `SwaggerDisabledInProdIT` (2)    | mapa completo da API exposto em produção                                                                              |
| `AdminStatsControllerTest` (3)   | `@PreAuthorize` ignorado em silêncio                                                                                  |
| `RestExceptionHandlerTest` (2)   | corpo malformado virando 500                                                                                          |

### O que NÃO está coberto

- Frontend: nenhum teste de componente nesta fase além dos 89 de i18n já
  existentes. O E2E de navegador (Playwright) é a fase 10.
- Concorrência: nenhum teste dispara duas requisições simultâneas. Não há
  dinheiro nem estoque no sistema hoje; quando houver, entra no checklist.
- `mealvision` (análise de foto): sem teste de integração; o endpoint é coberto
  apenas pelo teste de rota autenticada.
- Schedulers de notificação: sem teste.
- Google OAuth: o verificador de token não é exercitado por integração.

## Como verificar em produção

```sql
-- Todo plano precisa pertencer ao tenant do dono. Deve retornar zero linhas.
SELECT p.id FROM meal_plans p JOIN users u ON u.id = p.user_id
 WHERE p.tenant_id IS DISTINCT FROM u.tenant_id;

SELECT p.id FROM workout_plans p JOIN users u ON u.id = p.user_id
 WHERE p.tenant_id IS DISTINCT FROM u.tenant_id;
```

## Dívida conhecida

- A cobertura de branch (53,4%) é bem menor que a de linha (82,5%): os caminhos
  de erro menos comuns seguem sem exercício.
- `TenantIsolationIT` compara corpos de resposta por id e por rótulo. Isso só
  funciona enquanto cada par tiver dados distinguíveis; foi exatamente o que
  faltou na primeira versão e deixou uma sabotagem passar despercebida.

## Histórico

- **2026-09-06**: suíte criada (fase 7). 72 testes de integração novos, contra
  zero antes; os unitários vão de 80 para 79 (o `contextLoads` foi removido:
  subir o contexto passou a ser exercitado por sete classes de integração).
  Cobertura de linha de 35,9% para 82,5%, branch de 15,4% para 53,4%; piso do
  JaCoCo elevado de 35/15 para 80/50. Correção do achado T-1.
