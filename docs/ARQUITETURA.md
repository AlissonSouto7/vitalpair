# VitalPair — Documento de Arquitetura e Contexto de Projeto

> Versão 1.1. Transcrição do PDF oficial (`VitalPair_Arquitetura.pdf`). Documento de referência permanente: consultar antes de implementar qualquer feature.

## 1. Visão Geral do Produto

VitalPair é um app web de saúde e fitness para **casais/duplas** com objetivos opostos ou complementares (ex: ela quer perder peso, ele quer ganhar massa). Gerencia ambos de forma independente mas conectada, com competição, compartilhamento e gamificação.

### 1.1 Proposta de valor
- Planos alimentares e de treino gerados por IA com base no perfil/objetivo individual
- Contas separadas no mesmo sistema, cada uma com meta e dashboard próprios
- Feed compartilhado: cada um vê o que o parceiro comeu, treinou e quantos passos deu
- Competição semanal com placar, badges e pontos por consistência
- Integração com apps externos (WeWard, Google Fit, Strava) para dados automáticos
- Registro de refeições via Open Food Facts (gratuita, cobre produtos BR)

### 1.2 Usuários iniciais
Um casal: ela quer perder peso, ele quer ganhar massa. Ambos usam WeWard. Sistema calcula TDEE de cada um e define metas opostas (déficit para ela, superávit para ele).

### 1.3 Roadmap SaaS
- **MVP**: dois usuários (o casal), custo zero com Oracle Free Tier
- **Beta**: abrir para outros casais, multi-tenancy pronto desde o início
- **SaaS**: freemium (1 par grátis) + premium (IA avançada, múltiplos pares, histórico ilimitado)
- **Escala**: migrar Oracle → VPS dedicada (Hetzner/DigitalOcean)
- Stripe para pagamentos e assinaturas

## 2. Stack Técnica

| Camada | Tecnologia |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS |
| Backend | Java 17 + Spring Boot 3.5.15 |
| ORM | Spring Data JPA + Hibernate |
| Banco principal | PostgreSQL 15+ |
| Cache/Sessões | Redis (sessões JWT, cache TDEE, streaks, rate limiting) |
| Auth | Spring Security + JWT + OAuth2 (Google/Apple) |
| API de alimentos | Open Food Facts |
| Infra | Oracle Free Tier VPS + DuckDNS (2 OCPUs, 12GB RAM, 200GB) |
| Reverse proxy | Nginx (SSL, servir frontend estático) |
| Containers | Docker + Docker Compose |
| CI/CD | GitHub Actions |

**Por que não Vercel para backend:** não suporta Spring Boot nativo, cobrança por invocação imprevisível, sem controle do servidor (Redis/workers/jobs), multi-tenancy complexo. Decisão: Oracle Free Tier no MVP, migração planejada para Hetzner/DigitalOcean.

### 2.3 Plano de migração de infra
- MVP/Dev: Oracle Free Tier + DuckDNS — R$0 — até ~100 usuários
- SaaS inicial: Oracle + domínio próprio (.app) — ~R$50/ano — primeiro pagante
- Crescimento: Hetzner CX21 (4GB) + Cloudflare Free — ~R$50/mês — acima de 500 usuários
- Escala: DigitalOcean Managed DB + auto-scaling — ~R$200+/mês — acima de 5.000 usuários

## 3. Arquitetura do Sistema

Monólito modular no backend, separação por feature/domínio (não por camada técnica). Sem microserviços antes de validar produto, mas estrutura pronta para extração futura.

**Fluxo:** browser → Nginx serve React → chamadas REST `/api/*` → Nginx faz proxy para Spring Boot (8080) → autentica JWT → lógica → PostgreSQL/Redis. Busca de alimentos chama Open Food Facts. Wearables via OAuth2 (Google Fit/Strava).

### 3.2 Estrutura de pacotes — Backend (`com.aps.vitalpair`)

Arquitetura **hexagonal (Ports & Adapters) por feature**. Regras completas em `docs/adr/0001-arquitetura-hexagonal.md`. Base package real: `com.aps.vitalpair` (groupId `com.aps`).

Blocos transversais:
```
com.aps.vitalpair
├── VitalpairApplication.java
├── shared/        # kernel: web (ApiResponse, PageResponse, ApiError, RestExceptionHandler), exception (DomainException...)
├── config/        # SecurityConfig, RedisConfig, CorsConfig, OpenApiConfig, FeignConfig
└── tenant/        # TenantContext (ThreadLocal), TenantFilter (multi-tenancy)
```

Cada feature segue a mesma divisão em três camadas:
```
<feature>/
├── domain/                 # núcleo puro, sem Spring/JPA
│   ├── model/              # entidades de domínio + value objects
│   └── port/
│       ├── in/             # casos de uso (interfaces de entrada)
│       └── out/            # gateways (persistência, APIs externas)
├── application/            # implementa port.in, orquestra port.out
│   ├── service/            # @Service / @Transactional
│   └── dto/                # commands / queries / results
└── infrastructure/         # adaptadores
    ├── web/                # controllers REST + request/response DTOs + mappers
    ├── persistence/        # JpaEntity + Spring Data repo + adapter (implementa port.out)
    └── client/             # Feign clients + adapters (Open Food Facts, Anthropic)
```

Features: `auth`, `user`, `pair`, `nutrition`, `workout`, `tdee` (serviço de domínio: só domain+application), `activity`, `gamification`, `ai`.

**Regra de dependência: infrastructure → application → domain.** O domínio não depende de framework.

`src/main/resources/`: application.yaml, application-dev.yaml, application-prod.yaml, db/migration (Flyway).

### 3.3 Estrutura do Frontend (React)
```
src/
  api/           # axios instance, interceptors, endpoints por feature
  components/     # reutilizáveis (Button, Card, Chart, Modal)
  features/
    auth/        # Login, Register, OAuth2Callback
    dashboard/   # DashboardPage, CalorieRing, MacroSummary
    pair/        # PairFeed, PartnerCard, CompetitionScore
    nutrition/   # FoodSearch, MealLog, DailyNutritionView
    workout/     # WorkoutPlan, ExerciseList, LogSession
    activity/    # StepsInput, WearableConnect, ActivityHistory
    profile/     # ProfileSetup, GoalConfig, TdeeDisplay
    gamification/# Badges, Streaks, Leaderboard
  hooks/         # useAuth, usePair, useNutrition, useWorkout
  store/         # Zustand ou Context API
  types/ utils/ router/
```

## 4. Modelagem do Banco

### 4.1 Multi-tenancy
- Abordagem: **shared database, shared schema** com coluna `tenant_id` em todas as tabelas de negócio
- Cada **par de usuários = um tenant** (a tabela `pairs` é o tenant; `pairs.id` é o `tenant_id`)
- `TenantFilter` (OncePerRequestFilter) extrai `tenant_id` do JWT e injeta em ThreadLocal
- `TenantContext`: acessa o `tenant_id` atual em qualquer camada
- Spring Data: queries sempre filtram por `tenant_id`, nunca vaza entre tenants
- Futuro: migração para schemas separados se compliance exigir

### 4.2 Entidades principais

**users**: id (UUID PK), tenant_id (UUID NOT NULL), email (UNIQUE), password_hash (BCrypt, nulo se OAuth2), name, birth_date, sex ENUM(MALE,FEMALE,OTHER), height_cm DECIMAL(5,2), weight_kg DECIMAL(5,2), goal ENUM(LOSE_WEIGHT,GAIN_MUSCLE,MAINTAIN,IMPROVE_FITNESS), activity_level ENUM(SEDENTARY,LIGHT,MODERATE,ACTIVE,VERY_ACTIVE), daily_calorie_target INT, protein_target_g INT, carb_target_g INT, fat_target_g INT, avatar_url, created_at, updated_at

**pairs** (tenant): id (UUID PK = tenant_id), user1_id (FK), user2_id (FK, nulo até aceitar), pair_name, invite_code (UNIQUE), status ENUM(PENDING,ACTIVE,PAUSED), created_at

**food_logs**: id, tenant_id, user_id, food_name, barcode, quantity_g DECIMAL(7,2), calories_kcal DECIMAL(7,2), protein_g/carb_g/fat_g DECIMAL(6,2), meal_type ENUM(BREAKFAST,LUNCH,DINNER,SNACK), logged_at, source ENUM(OPEN_FOOD_FACTS,MANUAL)

**activity_logs**: id, tenant_id, user_id, activity_type ENUM(STEPS,RUN,WALK,CYCLE,WORKOUT,OTHER), steps INT, distance_km DECIMAL(6,3), calories_burned DECIMAL(7,2), duration_minutes INT, source ENUM(WEWARD,GOOGLE_FIT,APPLE_HEALTH,STRAVA,GARMIN,MANUAL), external_id (evita duplicatas), logged_at

**workout_plans**: id, tenant_id, user_id, name, goal, generated_by_ai, is_active
**workout_exercises**: id, plan_id, name, sets, reps, rest_seconds, order_index
**workout_sessions**: id, tenant_id, user_id, plan_id, calories_burned, notes, completed_at

**Gamificação:**
- badges: id, code, name, description, icon_url, category (catálogo)
- user_badges: id, tenant_id, user_id, badge_id, earned_at
- user_streaks: id, tenant_id, user_id, type, current_count, longest_count, last_activity_date
- competition_scores: id, tenant_id, week_start, user1_score, user2_score, winner_id

## 5. Funcionalidades

- **Onboarding/Perfil**: cadastro email+senha ou OAuth2; form de perfil; TDEE automático ao salvar; macros (proteína 2g/kg ganho, 1.6g/kg perda); convite via código de 8 dígitos único.
- **Dashboard diário**: anel de calorias (consumidas vs meta), barras de macros, calorias gastas (passos+treino), balanço (consumido − gasto vs meta), mini-card do parceiro, alertas inteligentes.
- **Refeições (Open Food Facts)**: busca por nome (autocomplete), por código de barras (manual ou câmera), seleção de porção em gramas, tipo de refeição, entrada manual, cache no Redis dos mais usados.
- **Atividade/WeWard**: input manual de passos (passos × 0.04 kcal), input manual de calorias, webhook/polling WeWard futuro, registro de treino, histórico com gráficos.
- **Feed do par**: timeline cronológica das ações dos dois, reações (fogo/olho/força), refeições privadas, push notifications.
- **Competição/Gamificação**: placar semanal por consistência. Pontos: log alimentar completo +10, treino concluído +15, meta diária atingida +20, streak de 7 dias +50. Streaks, badges por categoria, desafios semanais do par, histórico de campeonatos.
- **Planos por IA**: plano alimentar semanal (7 dias), plano de treino por objetivo, ajuste semanal por check-in de peso, restrições alimentares configuráveis. Implementação: API Anthropic Claude (claude-sonnet-4-6) com contexto do usuário.

## 6. APIs e Integração

### 6.1 Endpoints REST principais (prefixo `/api/v1`)

**/auth**: POST /register, POST /login (retorna access+refresh), POST /refresh, POST /oauth2/google, POST /logout
**/users**: GET /me, PUT /me, GET /me/tdee, GET /me/stats
**/pair**: POST /invite, POST /join/:code, GET /, GET /feed (paginado), GET /competition
**/nutrition**: GET /foods/search?q=, GET /foods/barcode/:code, GET /logs?date=, POST /logs, DELETE /logs/:id, GET /summary?date=, GET /history?days=30
**/activity**: POST /logs, GET /logs?date=, GET /summary?date=, POST /wearable/sync

### 6.2 Open Food Facts
- Produto: `https://world.openfoodfacts.org/api/v2/product/:barcode.json`
- Busca: `https://world.openfoodfacts.org/cgi/search.pl?search_terms=:query&json=true`
- Sem autenticação, gratuita
- Campos: product_name, nutriments.energy-kcal_100g, proteins_100g, carbohydrates_100g, fat_100g
- Cache Redis TTL 24h (chave `off:barcode:<code>`)
- Fallback para banco local de alimentos BR se API cair
- **User-Agent obrigatório**: `VitalPair/1.0 (contact@vitalpair.app)`

### 6.3 Cálculo de TDEE (Mifflin-St Jeor)
- Homem: BMR = (10 × peso_kg) + (6.25 × altura_cm) − (5 × idade) + 5
- Mulher: BMR = (10 × peso_kg) + (6.25 × altura_cm) − (5 × idade) − 161
- TDEE = BMR × multiplicador de atividade
- Multiplicadores: Sedentário ×1.2 | Levemente ativo ×1.375 | Moderado ×1.55 | Muito ativo ×1.725 | Extremamente ativo ×1.9
- Meta perda: TDEE − 500 kcal (~0.5kg/semana). Macros perda: proteína 2g/kg, gordura 0.8g/kg, carbo = restante
- Meta ganho: TDEE + 300 kcal. Macros ganho: proteína 2.2g/kg, gordura 1g/kg, carbo = restante

## 7. Segurança

### 7.1 Auth
- JWT curto: access_token 15min, refresh_token 30 dias
- Refresh tokens no Redis com revogação imediata (logout real)
- Spring Security: rotas públicas `/auth/**`, resto protegido
- `@PreAuthorize` nas controllers (usuário só acessa seus dados)
- OAuth2 Google: validar id_token no backend
- Senhas: BCrypt strength 12

### 7.2 Multi-tenancy/isolamento
- TenantFilter extrai tenant_id do JWT → ThreadLocal
- TenantContext em qualquer camada
- Repositórios filtram por tenant_id automaticamente
- Teste: garantir que /nutrition/logs nunca vaze outro tenant

### 7.3 Outras práticas
- HTTPS obrigatório (Let's Encrypt + certbot)
- CORS explícito (só domínio do frontend)
- Rate limiting Redis (100 req/min por usuário)
- Bean Validation (@Valid, @NotNull, @Size) em todos os DTOs
- Sem SQL injection (Spring Data/queries parametrizadas)
- Logs de segurança com IP
- Secrets em .env/variáveis de ambiente, nunca hardcoded

## 8. Infra e Deploy

- Oracle: VM.Standard.A1.Flex (ARM), 2 OCPUs, 12GB RAM, 200GB; Ubuntu 22.04 LTS; DNS DuckDNS (vitalpair.duckdns.org); firewall só 22/80/443.
- Docker Compose: postgres (15-alpine), redis (7-alpine, requirepass), backend (build ./vitalpair-backend, porta 8080), frontend (build ./vitalpair-frontend, 3000:80), nginx (80/443, proxy).
- CI/CD GitHub Actions: push main → checkout → build Maven → testes → build Docker → push GHCR → SSH Oracle → docker-compose pull+up. Secrets: ORACLE_SSH_KEY, ORACLE_HOST, GHCR_TOKEN. Zero-downtime e rollback (2 últimas imagens).
- Nginx: location `/` → frontend:80; location `/api/` → backend:8080 (repassa header Authorization); SSL via /certs/live/...

## 9. Instruções de código (CRÍTICO)

### 9.2 Princípios
- Clean Code, SOLID (Single Responsibility, Dependency Inversion)
- Não sobre-engenheirar (monólito modular agora)
- Testes: JUnit 5 + Mockito (serviços), MockMvc (controllers)
- **Migração de banco: SEMPRE Flyway, NUNCA `spring.jpa.hibernate.ddl-auto=create`**
- **DTOs sempre: nunca expor entidades JPA na API (usar record ou classe DTO)**
- Logs SLF4J + Logback (INFO em prod, DEBUG em dev)
- GlobalExceptionHandler com @ControllerAdvice, respostas padronizadas

### 9.3 Convenções
- Java: camelCase métodos/vars, PascalCase classes, UPPER_SNAKE constantes
- Pacotes: `com.vitalpair.<feature>`
- Endpoints: plural para coleções (/foods, /logs), snake_case em query params
- **Respostas sempre em `ApiResponse<T> { data, message, success }`**
- Datas: ISO 8601 (`2025-06-21T10:30:00Z`), nunca timestamp Unix na API
- React: componentes funcionais com hooks, nenhum de classe
- CSS: Tailwind utility classes, evitar CSS custom (exceto animações complexas)

### 9.4 Ordem sugerida de implementação
1. Setup (Git, pastas, Docker Compose Postgres+Redis)
2. Backend base (Spring config, Security, JWT, GlobalExceptionHandler, ApiResponse)
3. Migrations Flyway (todas as tabelas da Seção 4)
4. Auth (/register, /login com JWT + testes integração)
5. Perfil e TDEE (UserController/Service, TdeeService Harris-Benedict)
6. Sistema de par (PairService, convite, aceitação, criação do tenant)
7. Nutrição (Open Food Facts client, FoodLog CRUD, dashboard diário)
8. Atividade (ActivityLog, calorias gastas, input de passos)
9. Gamificação (streaks, badges, placar semanal)
10. Frontend (React+TS+Tailwind, Router, axios interceptors)
11. Telas (Login/Register → Onboarding → Dashboard → Log alimentar → Feed)
12. Deploy (Dockerfiles, docker-compose, Nginx, SSL)
13. CI/CD (GitHub Actions → Oracle)

### 9.5 Variáveis de ambiente
DATABASE_URL (jdbc:postgresql://postgres:5432/vitalpair), DATABASE_USER, DATABASE_PASSWORD, REDIS_HOST, REDIS_PASSWORD, JWT_SECRET (min 256 bits base64), JWT_ACCESS_EXPIRATION_MS (900000), JWT_REFRESH_EXPIRATION_MS (2592000000), GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ANTHROPIC_API_KEY, FRONTEND_URL, OPEN_FOOD_FACTS_USER_AGENT

## 10. Roadmap

- **Fase 1 (MVP)**: auth completo (email+Google), perfil+TDEE, par com convite, refeições Open Food Facts, input manual de calorias, dashboard diário, feed básico, deploy Oracle com HTTPS.
- **Fase 2 (Engajamento)**: planos IA (treino e alimentar), gamificação completa, desafios do par, push notifications, histórico/gráficos, modo privado.
- **Fase 3 (SaaS)**: multi-tenancy validado, Stripe (freemium/premium), landing page, onboarding guiado, integrações Google Fit/Apple Health/Strava/WeWard, admin panel, migração Oracle→Hetzner, domínio próprio.

## 11. Build / pom.xml (pontos críticos)

- Parent: spring-boot-starter-parent 3.5.15. groupId `com.aps`, artifactId **`vitalpair`** (o PDF dizia `vital-pair`). java.version **17**, spring-cloud 2025.0.3, jjwt 0.12.6, **springdoc 2.8.9** (o PDF pinava 2.6.0, que é incompatível com Boot 3.5: `NoSuchMethodError ControllerAdviceBean.<init>(Object)`), mapstruct 1.6.2. Testcontainers (postgresql, junit-jupiter) adicionado para testes de integração.
- Dependências: web, security, oauth2-client, oauth2-resource-server, jjwt (api compile / impl+jackson runtime), data-jpa, postgresql (runtime), flyway-core + flyway-database-postgresql, data-redis, spring-session-data-redis, validation, actuator, spring-cloud-starter-openfeign, springdoc-openapi-starter-webmvc-ui, mapstruct, lombok (optional), devtools, docker-compose, starter-test, security-test.
- **maven-compiler-plugin**: ordem obrigatória nos annotationProcessorPaths: (1) Lombok, (2) mapstruct-processor, (3) lombok-mapstruct-binding 0.2.0. Arg `-Amapstruct.defaultComponentModel=spring`. Lombok excluído do fat JAR no spring-boot-maven-plugin.
