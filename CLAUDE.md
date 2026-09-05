# CLAUDE.md

Engineering rules for this repository. Written for AI assistants, but everything
here applies to human contributors too. Read it before touching the code.

For the contribution workflow (branches, commits, pull requests, migrations),
see [CONTRIBUTING.md](CONTRIBUTING.md). This file is about how the code is built
and what "done" means.

## 1. Project snapshot

VitalPair is a health and fitness app for pairs. Two people with opposite goals
(one cutting, one bulking) log meals and workouts, score points, and compete
across seasons. Meal photos are analysed by AI to estimate calories.

Stack:

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 3.5, Maven |
| Persistence | PostgreSQL, Flyway migrations, Spring Data JPA |
| Cache and tokens | Redis |
| Auth | JWT access token, opaque refresh token in Redis, Google OAuth2 |
| API docs | springdoc-openapi |
| Mapping | MapStruct |
| External APIs | Anthropic (meal photo analysis, plan generation), Open Food Facts |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, react-i18next |

Repository map:

```
src/main/java/com/aps/vitalpair/   backend, one package per feature
src/main/resources/db/migration/   Flyway migrations (V1..Vn)
src/test/java/                     backend tests
frontend/src/                      React application
frontend/src/locales/              i18n bundles, one module per namespace
docs/adr/                          architecture decision records
docs/features/                     one living document per feature
.github/                           workflows, issue and PR templates
compose.yaml                       local Postgres and Redis
```

## 2. Language policy

- Code, comments, Javadoc, commit messages, pull requests, ADRs, and technical
  documentation are written in **English**.
- User interface strings are **never** hardcoded. They live in
  `frontend/src/locales/<namespace>.ts`, which carries all four supported
  languages (`pt`, `en`, `es`, `fr`) side by side. A new key must be added to
  all four at once.
- The product's primary language is Brazilian Portuguese; `pt` is the reference
  bundle and the other three are translations of it.
- Backend exception messages that reach the end user are still in Portuguese.
  Replacing them with error codes translated on the frontend is planned; until
  then, do not translate them to English piecemeal.
- Existing Portuguese comments and Javadoc are being migrated package by
  package. Do not add new ones.

## 3. Non-negotiables

- **Never push.** Not `git push`, not a force push, not a tag, not a PR merge.
  Only the repository owner pushes.
- **Never commit without an explicit instruction.** Finish the work, run the
  tests, report the result, then stop and wait. Approval on a previous commit
  does not carry over to the next one.
- **One phase, one branch, one pull request.**
- **Every change ships with before-and-after evidence.** A bug fix needs a test
  that fails before the fix and passes after it, with both outputs quoted. A
  feature needs proof it does what it claims.
- **Never invent a number.** Every count, percentage, timing or coverage figure
  comes from a command whose output you actually saw. If you did not measure it,
  write "not measured" and name the command that would measure it.
- **A test that passes on the first run is suspect.** Break the production code
  on purpose and confirm the test catches it.
- **Security is part of the change, not a later step.** Run the checklist in
  section 8 on every change that touches a route, a query, a form, an upload or
  a permission, and report the result even when everything is fine.
- **A feature change updates `docs/features/<name>.md`** in the same pull
  request, not afterwards.

## 4. Comment style

- Comments explain **why**, not what. The code already says what it does.
- No narration, no assistant voice, no emoji. Never write "Here we...", "As
  requested...", "Now let's...", or "This function simply...".
- Javadoc where it defines a contract: public ports, services, and anything
  whose behaviour is not obvious from the signature. Not on getters, not on
  self-explanatory private helpers.
- Anything that only matters to an AI session (scratch notes, session context,
  planning) goes in `.claude/notes/`, which is gitignored. It never lands in
  source files or commit messages.
- No commit or comment ever credits an AI as author or co-author.

## 5. Architecture rules

The backend is hexagonal, organised **feature-first**. Each feature package
owns its own layers:

```
<feature>/
  domain/
    model/          domain types, no framework annotations
    port/in/        use case interfaces the application implements
    port/out/       interfaces the infrastructure implements
    exception/      domain exceptions
  application/
    service/        use case implementations, transaction boundaries
    dto/            application-level data carriers
    listener/       domain event listeners, when the feature reacts to others
  infrastructure/
    web/            REST controllers
    persistence/    JPA entities, repositories, adapters
    <other>/        mail, security, external clients
```

Rules that are enforced, or will be enforced by ArchUnit:

- Dependencies point inwards only: `infrastructure -> application -> domain`.
  The domain imports nothing from the outer layers and no Spring, JPA or
  Jackson annotations.
- A feature never imports another feature's `infrastructure` or
  `application.service`. Cross-feature communication goes through published
  ports or Spring events.
- `@RestController` only in `..infrastructure.web..`. `@Entity` only in
  `..infrastructure.persistence..`.
- No JPA associations between entities. Aggregates are assembled explicitly in
  the service layer, so every query stays visible.
- Mapping between layers uses MapStruct, not hand-written copy loops.
- Every REST response is wrapped in `ApiResponse<T>` (`success`, `message`,
  `data`). Errors go through `RestExceptionHandler`.
- Domain events use `@TransactionalEventListener(AFTER_COMMIT)` with
  `REQUIRES_NEW`, so a listener failure never rolls back the originating
  transaction. Keep it that way.

Migrations:

- **A migration that has been applied is immutable.** Never edit `V1..Vn` after
  it has run anywhere. Fix it with a new migration.
- Migrations follow **expand/contract**: add the new column or table first, ship
  the code that writes to both, backfill, then drop the old one in a later
  release. A deploy must be able to roll the application back without rolling
  back the database.
- Every query that touches user-owned data is scoped by the owner. Never rely on
  an id from the request alone.

## 6. Conventions

- **Commits**: Conventional Commits, imperative mood, English. The scope is the
  feature package: `feat(auth): add refresh token rotation`,
  `fix(nutrition): correct macros per serving`.
- **Branches**: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`,
  `build/`, `ci/`, `infra/` followed by a short kebab-case description.
- **Routes and URLs** are English and kebab-case: `/forgot-password`, not
  `/esqueci-senha`.
- The pull request template is mandatory and is filled in, not deleted.
- Before proposing a pull request, run `./mvnw verify` and, if the frontend
  changed, `npm run lint && npm run build` in `frontend/`.

## 7. How to run

Requires JDK 17, Node, and Docker (Testcontainers and the local database need
it).

```bash
cp .env.example .env          # then fill in the values

docker compose up -d          # Postgres and Redis

./mvnw spring-boot:run        # backend on :8080

cd frontend && npm ci && npm run dev   # frontend on :5173
```

Tests:

```bash
./mvnw test                   # unit tests
./mvnw verify                 # full build, including integration tests
cd frontend && npm run build  # type check and production build
```

With `MAIL_ENABLED=false` (the default in development) password reset and email
verification links are not sent; they are written to the application log.

## 8. Security checklist

Run this on every change that touches a route, controller, query, form, upload
or permission, and report the result in the pull request even when nothing is
wrong.

- **Input validated on the server.** `@Valid` with Bean Validation on the
  backend; a frontend check is UX, not a guard. Validate type, range, length and
  enum membership.
- **Authorization per object, not just per route.** A route guard is not enough:
  confirm the resource belongs to the caller. `/thing/{id}` without an ownership
  filter is an IDOR.
- **Tenant scope on every query** that reads or writes user-owned data.
- **No mass assignment.** Never bind raw request input straight onto an entity.
- **No secret, token or PII in logs**, responses, or committed files.
- **Money, stock and external state** change inside a transaction with the row
  locked. Ask "what happens if two of these run at once?" and answer it with a
  test.
- **External callbacks are authenticated** (signature, token or IP allowlist)
  and idempotent.
- **Rate limiting** on any new public or expensive endpoint.
- **Queries are parameterised.** No string concatenation into SQL or JPQL.
- **Output is escaped.** No raw HTML injection on the frontend.
- **New environment variables** are added to `.env.example` with a placeholder,
  never a real value.
- **Dependencies are pinned** to an explicit version.

If you find a hole outside the scope of your task, report it. Never leave it
unmentioned because it was not your job.

## 9. Definition of done

A change is done when all of these are true:

1. It does what it claims, verified by running it, not by reading it.
2. Tests cover the new behaviour, and any bug fix has a red-to-green proof.
3. `./mvnw verify` passes locally, and the frontend builds if it was touched.
4. The security checklist in section 8 was run and its result reported.
5. `docs/features/<name>.md` is created or updated if a feature changed.
6. An ADR is added if an architectural decision was made.
7. CI is green on the pull request.
8. The report states, per dimension, how much is verified and what is not:
   functional, tested, secure, safe to deploy, clean. Every figure is backed by
   a command output. What was not measured is labelled as not measured.

## 10. Documentation map

| Document | What it holds |
|---|---|
| [README.md](README.md) | What the project is, how to run it |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branching, commits, pull requests, migrations, i18n |
| [SECURITY.md](SECURITY.md) | How to report a vulnerability, known open issues |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards |
| [docs/adr/](docs/adr/) | Architecture decision records, one per decision |
| [docs/features/](docs/features/) | One living document per feature |
| `docs/ARQUITETURA.md` | Current architecture overview, being rewritten in English |
