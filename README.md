# VitaPair — Backend

App web de saúde e fitness para **casais** com objetivos opostos ou complementares (ex: um quer perder peso, o outro ganhar massa). O sistema gerencia os dois de forma independente mas conectada, com competição, feed compartilhado e gamificação.

Este repositório contém o **backend** (Java 17 + Spring Boot 3). O frontend (React + TypeScript + Tailwind) virá em repositório/módulo separado.

## Stack

| Camada | Tecnologia |
|---|---|
| Linguagem/Runtime | Java 17 |
| Framework | Spring Boot 3.5 (Web, Security, Data JPA, Data Redis, Validation, Actuator) |
| Banco | PostgreSQL 15 + Flyway (migrations) |
| Cache/Sessões | Redis 7 |
| Auth | Spring Security + JWT (jjwt) |
| Docs | springdoc-openapi (Swagger UI) |
| Mapeamento | MapStruct + Lombok |
| Testes | JUnit 5, Mockito, Testcontainers |

## Arquitetura

Arquitetura **hexagonal (Ports & Adapters) por feature**. Cada feature tem três camadas com a regra de dependência `infrastructure → application → domain` (o domínio não depende de framework):

```
com.aps.vitapair
├── shared/        # kernel: ApiResponse, ApiError, exceções, tratamento global de erros
├── config/        # SecurityConfig, JwtProperties, OpenApiConfig
├── tenant/        # TenantContext (multi-tenancy via ThreadLocal)
└── <feature>/
    ├── domain/          # model + port/in (casos de uso) + port/out (gateways)
    ├── application/     # service (implementa os casos de uso) + dto
    └── infrastructure/  # web (REST) + persistence (JPA) + client (APIs externas)
```

Detalhes e convenções: [docs/ARQUITETURA.md](docs/ARQUITETURA.md) e [docs/adr/0001-arquitetura-hexagonal.md](docs/adr/0001-arquitetura-hexagonal.md). A feature `nutrition` é a referência (molde) da estrutura.

Multi-tenancy: cada **par de usuários é um tenant** (tabela `pairs`, cujo `id` é o `tenant_id` de todas as tabelas de negócio).

## Pré-requisitos

- JDK 17
- Docker + Docker Compose (para Postgres e Redis)

## Como rodar (desenvolvimento)

O projeto usa `spring-boot-docker-compose`: ao iniciar a aplicação em dev, o Postgres e o Redis do [compose.yaml](compose.yaml) sobem automaticamente.

1. Copie `.env.example` para `.env` e ajuste se necessário. O `.env` é lido tanto pelo Spring (`spring-dotenv`) quanto pelo docker compose, e **não** é versionado.
2. Rode:

```bash
./mvnw spring-boot:run
```

A API sobe em **`http://localhost:8081`** no profile `dev` (porta 8081 para coexistir com outros serviços locais na 8080; configurável via `SERVER_PORT`). O profile `dev` é o padrão e já traz um `JWT_SECRET` de desenvolvimento.

> Se as portas 5432/6379 já estiverem em uso na sua máquina, defina `VITAPAIR_DB_PORT` e `VITAPAIR_REDIS_PORT` no `.env` (o app detecta a porta publicada automaticamente).

### Subindo o banco/redis manualmente

```bash
docker compose up -d
./mvnw spring-boot:run
```

> As portas do host do Postgres/Redis são parametrizáveis (caso 5432/6379 já estejam em uso):
> ```bash
> VITAPAIR_DB_PORT=5433 VITAPAIR_REDIS_PORT=6380 docker compose up -d
> ```

## Variáveis de ambiente

Veja [.env.example](.env.example). Em dev há defaults; em produção, defina ao menos: `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`, `REDIS_HOST`, `REDIS_PASSWORD`, `JWT_SECRET` (≥ 32 caracteres), `FRONTEND_URL`.

## Documentação da API (Swagger)

Com a aplicação rodando (porta 8081 em dev):

- Swagger UI: `http://localhost:8081/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8081/v3/api-docs`

Para testar endpoints protegidos: faça `POST /api/v1/auth/login`, copie o `accessToken`, clique em **Authorize** no Swagger e cole o token.

## Endpoints disponíveis

Todas as respostas usam o envelope `ApiResponse<T> { success, message, data }`.

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Cria conta (e o tenant do usuário) | público |
| POST | `/api/v1/auth/login` | Autentica, retorna access + refresh token | público |
| POST | `/api/v1/auth/oauth2/google` | Login com Google (valida o `idToken`, find-or-create) | público |
| POST | `/api/v1/auth/refresh` | Renova tokens (rotação do refresh) | público |
| POST | `/api/v1/auth/logout` | Revoga o refresh token | público |
| GET | `/api/v1/users/me` | Perfil do usuário autenticado | JWT |
| PUT | `/api/v1/users/me` | Atualiza o perfil e recalcula TDEE/macros | JWT |
| GET | `/api/v1/users/me/tdee` | BMR, TDEE, meta calórica e macros | JWT |
| GET | `/api/v1/pair` | Par atual (membros e status) | JWT |
| POST | `/api/v1/pair/invite` | Retorna o código de convite do par | JWT |
| POST | `/api/v1/pair/join/{code}` | Aceita um convite e forma o par | JWT |
| GET | `/api/v1/pair/feed?page=&size=` | Timeline compartilhada do par (paginada) | JWT |
| GET | `/api/v1/nutrition/foods/search?q=` | Busca alimentos (Open Food Facts) | JWT |
| GET | `/api/v1/nutrition/foods/barcode/{code}` | Busca por código de barras | JWT |
| POST | `/api/v1/nutrition/logs` | Registra uma refeição | JWT |
| GET | `/api/v1/nutrition/logs?date=` | Refeições do dia | JWT |
| DELETE | `/api/v1/nutrition/logs/{id}` | Remove um registro | JWT |
| GET | `/api/v1/nutrition/summary?date=` | Resumo diário (consumido vs meta) | JWT |
| POST | `/api/v1/activity/logs` | Registra atividade (estima kcal de passos) | JWT |
| GET | `/api/v1/activity/logs?date=` | Atividades do dia | JWT |
| GET | `/api/v1/activity/summary?date=` | Total de calorias gastas e passos | JWT |
| GET | `/api/v1/dashboard?date=` | Balanço do dia (consumido − gasto vs meta) + parceiro | JWT |
| GET | `/api/v1/gamification/streaks` | Sequências (streaks) do usuário | JWT |
| GET | `/api/v1/gamification/competition` | Placar semanal do par | JWT |
| GET | `/actuator/health` | Health check | público |

### Exemplo

```bash
# Registrar
curl -X POST http://localhost:8081/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"ana@vitapair.app","password":"senha1234","name":"Ana"}'

# Login
curl -X POST http://localhost:8081/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ana@vitapair.app","password":"senha1234"}'
```

## Testes

```bash
./mvnw test
```

- Testes unitários (Mockito) rodam sem infraestrutura.
- O teste de contexto (`contextLoads`) sobe Postgres e Redis via **Testcontainers** (requer Docker em execução).

## Build

```bash
./mvnw clean package        # gera o JAR em target/
java -jar target/vitalpair-*.jar
```

## Fluxo de trabalho (Git Flow)

O projeto segue **Git Flow**: `main` (produção), `develop` (integração) e branches `feature/*`, `release/*`, `hotfix/*`. Não se commita direto em `main`/`develop`. Detalhes, comandos e convenções de commit/tag em [docs/GITFLOW.md](docs/GITFLOW.md).

## Deploy (produção)

Imagem Docker multi-stage ([Dockerfile](Dockerfile)) e stack em [compose.prod.yaml](compose.prod.yaml) (Postgres + Redis + backend + Nginx).

```bash
# no servidor, com um .env de produção (DATABASE_PASSWORD, REDIS_PASSWORD, JWT_SECRET, ...)
docker compose -f compose.prod.yaml up -d --build
```

- A aplicação roda com o profile `prod` (`SPRING_PROFILES_ACTIVE=prod`), atrás do Nginx ([nginx/nginx.conf](nginx/nginx.conf)) que faz reverse proxy e SSL (Let's Encrypt/certbot).
- **CI** ([.github/workflows/ci.yml](.github/workflows/ci.yml)): build + testes em cada push/PR para `main` e `develop`.
- **Deploy** ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)): no push para `main`, builda a imagem, publica no GHCR e atualiza o backend no servidor via SSH. Secrets necessários: `ORACLE_HOST`, `ORACLE_USER`, `ORACLE_SSH_KEY`.

## Roadmap

- **Fase 1 (MVP)** — em andamento: auth (✅ email/senha), perfil + TDEE, sistema de par, registro de refeições (Open Food Facts), dashboard diário, deploy Oracle.
- **Fase 2** — planos por IA, gamificação completa, notificações, OAuth2 Google.
- **Fase 3** — multi-tenancy validado, Stripe, integrações de wearables, admin panel.

Detalhes: [docs/ARQUITETURA.md](docs/ARQUITETURA.md).
