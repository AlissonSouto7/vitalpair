# ADR 0001 — Arquitetura Hexagonal (Ports & Adapters) por feature

- **Status:** Aceito
- **Data:** 2025-06-21
- **Contexto do projeto:** VitalPair (ver `docs/ARQUITETURA.md`)

## Contexto

O VitalPair é um monólito modular que nasce como MVP para um casal mas tem roadmap de virar SaaS. Precisamos de uma arquitetura que:

- Isole regra de negócio de detalhes técnicos (banco, web, APIs externas), para testar o domínio sem subir Spring nem banco.
- Tenha fronteiras claras por feature, facilitando manutenção e a eventual extração de um módulo para serviço separado.
- Seja o padrão que empresas sérias usam, não um CRUD acoplado.

## Decisão

Adotamos **Arquitetura Hexagonal (Ports & Adapters), organizada por feature/domínio**. Cada feature é uma fatia vertical com três camadas: `domain`, `application`, `infrastructure`.

### Regra de dependência (a regra de ouro)

```
infrastructure  ──>  application  ──>  domain
```

- `domain` **não depende de nada** (nem Spring, nem JPA, nem Jackson). Java puro.
- `application` depende **apenas** de `domain`.
- `infrastructure` depende de `application` e de `domain` (implementa as portas de saída e chama as portas de entrada).
- Nenhuma feature importa as classes `infrastructure`/`application` de outra feature. Comunicação entre features é feita por porta (interface) ou, no futuro, por evento de domínio.

### Camadas

#### `domain/`
Núcleo puro. Sem anotações de framework.
- `model/` — entidades de domínio e *value objects*. Modelam regra de negócio, **não** são entidades JPA.
- `port/in/` — interfaces dos **casos de uso** (entrada do hexágono). Ex: `LogMealUseCase`.
- `port/out/` — interfaces de **gateways** (saída do hexágono): persistência e serviços externos. Ex: `FoodLogRepositoryPort`, `OpenFoodFactsPort`.

#### `application/`
Orquestra o caso de uso. Depende só de `domain`.
- `service/` — implementações das portas de entrada (`@Service`, `@Transactional`). Recebem as portas de saída por construtor.
- `dto/` — *commands*, *queries* e *results* da camada de aplicação (objetos de entrada/saída dos casos de uso, independentes do HTTP).

#### `infrastructure/`
Adaptadores que conectam o mundo externo aos casos de uso.
- `web/` — controllers REST. Convertem request HTTP → command, chamam o caso de uso, convertem result → response. Aqui ficam os DTOs de request/response e os mappers web.
- `persistence/` — `JpaEntity` (entidade Hibernate), repositório Spring Data e um **adapter** que implementa a porta de saída de persistência, convertendo `domain.model` ↔ `JpaEntity`.
- `client/` — clientes de APIs externas (OpenFeign) e adapters que implementam as portas de saída correspondentes (Open Food Facts, Anthropic).

### Três modelos distintos (não misturar)

1. **Domain model** (`domain/model`) — regra de negócio, Java puro.
2. **JPA entity** (`infrastructure/persistence`) — mapeamento Hibernate (`@Entity`, `@Table`, `tenant_id`).
3. **Web DTO** (`infrastructure/web`) — contrato da API (request/response).

Conversões com **MapStruct** (já configurado no pom, `componentModel=spring`):
- web DTO ↔ application DTO/command
- domain model ↔ JPA entity

> Nunca expor JPA entity nem domain model diretamente no controller. Resposta sempre embrulhada em `ApiResponse<T>`.

### Multi-tenancy

`tenant_id` é responsabilidade da camada de `persistence` (o adapter aplica o filtro a partir de `TenantContext`) e do `TenantFilter`. O `domain` não conhece tenant.

## Exemplo materializado

A feature **`nutrition`** está materializada com a árvore completa (cada subpacote tem `package-info.java` descrevendo seu papel). Use-a como molde ao implementar `auth`, `user`, `pair`, etc.

```
nutrition/
├── domain/
│   ├── model/                FoodLog, Meal (domínio puro)
│   └── port/
│       ├── in/               LogMealUseCase, GetDailySummaryUseCase
│       └── out/              FoodLogRepositoryPort, OpenFoodFactsPort
├── application/
│   ├── service/              NutritionService (implements *UseCase)
│   └── dto/                  LogMealCommand, DailySummaryResult
└── infrastructure/
    ├── web/                  NutritionController, FoodLogRequest, DailySummaryResponse
    ├── persistence/          FoodLogJpaEntity, FoodLogJpaRepository, FoodLogPersistenceAdapter
    └── client/               OpenFoodFactsClient (Feign), OpenFoodFactsAdapter
```

## Convenções de nomenclatura

| Tipo | Sufixo / padrão | Camada |
|---|---|---|
| Caso de uso (interface) | `...UseCase` | domain.port.in |
| Gateway (interface) | `...Port` | domain.port.out |
| Serviço de aplicação | `...Service` | application.service |
| Command/Query/Result | `...Command`, `...Query`, `...Result` | application.dto |
| Controller | `...Controller` | infrastructure.web |
| Request/Response da API | `...Request`, `...Response` | infrastructure.web |
| Entidade JPA | `...JpaEntity` | infrastructure.persistence |
| Repositório Spring Data | `...JpaRepository` | infrastructure.persistence |
| Adapter de porta | `...PersistenceAdapter`, `...Adapter` | infrastructure.* |
| Cliente Feign | `...Client` | infrastructure.client |

## Testes

- `domain` e `application`: testes unitários puros (JUnit 5 + Mockito nas portas). Rápidos, sem Spring.
- `infrastructure.web`: `@WebMvcTest` + MockMvc.
- `infrastructure.persistence`: `@DataJpaTest` (Testcontainers/PostgreSQL quando necessário).
- Teste de isolamento multi-tenant é obrigatório (ver `docs/ARQUITETURA.md` §7.2).

## Consequências

**Prós:** domínio testável e isolado; troca de adaptador (ex: REST→gRPC, Feign→RestClient) sem tocar regra; fronteiras explícitas por feature; caminho claro para extrair serviço.

**Contras:** mais classes e mappers que um CRUD acoplado. Mitigação: MapStruct gera os mappers; só criamos a porta/adapter quando a feature realmente precisa daquele tipo de saída (não criamos camadas vazias por dogma).
