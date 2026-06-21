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

```bash
./mvnw spring-boot:run
```

A API sobe em `http://localhost:8080`. O profile `dev` é o padrão e já traz um `JWT_SECRET` de desenvolvimento.

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

Com a aplicação rodando:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

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
| GET | `/actuator/health` | Health check | público |

### Exemplo

```bash
# Registrar
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"ana@vitapair.app","password":"senha1234","name":"Ana"}'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
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
java -jar target/vitalpair-0.0.1-SNAPSHOT.jar
```

## Fluxo de trabalho (Git Flow)

O projeto segue **Git Flow**: `main` (produção), `develop` (integração) e branches `feature/*`, `release/*`, `hotfix/*`. Não se commita direto em `main`/`develop`. Detalhes, comandos e convenções de commit/tag em [docs/GITFLOW.md](docs/GITFLOW.md).

## Roadmap

- **Fase 1 (MVP)** — em andamento: auth (✅ email/senha), perfil + TDEE, sistema de par, registro de refeições (Open Food Facts), dashboard diário, deploy Oracle.
- **Fase 2** — planos por IA, gamificação completa, notificações, OAuth2 Google.
- **Fase 3** — multi-tenancy validado, Stripe, integrações de wearables, admin panel.

Detalhes: [docs/ARQUITETURA.md](docs/ARQUITETURA.md).
