# Contributing to VitalPair

Thanks for taking the time to look at this project. This document covers the
workflow: how branches, commits and pull requests are expected to look, and the
rules that apply to database migrations and translations.

Engineering rules (architecture, comment style, security checklist, definition
of done) live in [CLAUDE.md](CLAUDE.md). Read that one too before writing code.

VitalPair is licensed under the Business Source License 1.1, which is
source-available rather than open source. By contributing you agree that your
contribution is licensed under the same terms.

## Local setup

You need JDK 17, Node, and Docker. Docker is not optional: the local database
runs in it and the integration tests use Testcontainers.

```bash
git clone <repository-url>
cd vitalpair

cp .env.example .env
```

Fill in `.env`. At a minimum set `JWT_SECRET` to a random value of at least 32
characters:

```bash
openssl rand -base64 48
```

`ANTHROPIC_API_KEY` is only needed if you are working on meal photo analysis or
plan generation. `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are only needed
for Google sign-in.

Then:

```bash
docker compose up -d                    # Postgres and Redis

./mvnw spring-boot:run                  # backend on http://localhost:8080

cd frontend
npm ci
npm run dev                             # frontend on http://localhost:5173
```

API documentation is served at http://localhost:8080/swagger-ui.html while the
application is running.

With the default `MAIL_ENABLED=false`, password reset and email verification
emails are not sent. The link is written to the application log instead.

## Branching model

The project uses **GitHub Flow**. There is one long-lived branch, `main`, and it
is always deployable.

|                 |                                                                                       |
| --------------- | ------------------------------------------------------------------------------------- |
| `main`          | Protected. Always releasable. Never committed to directly.                            |
| Everything else | Short-lived. Branched from `main`, merged back via pull request, deleted after merge. |

There is no `develop` branch, no `release/*` and no `hotfix/*`. An urgent fix is
just a `fix/` branch that gets reviewed and merged faster.

Branch names are `<type>/<short-kebab-case-description>`:

| Prefix      | For                                            |
| ----------- | ---------------------------------------------- |
| `feat/`     | A new capability                               |
| `fix/`      | A bug fix                                      |
| `refactor/` | A change that does not alter behaviour         |
| `test/`     | Tests only                                     |
| `docs/`     | Documentation only                             |
| `chore/`    | Housekeeping, dependencies, repository hygiene |
| `build/`    | Build configuration, quality gates             |
| `ci/`       | Continuous integration and delivery            |
| `infra/`    | Deployment and infrastructure                  |

Examples: `feat/refresh-token-rotation`, `fix/macro-rounding`,
`chore/governance`.

```bash
git switch main && git pull
git switch -c feat/my-change
# work, commit
git push -u origin feat/my-change
# open the pull request
```

Keep branches short. If a branch lives longer than a few days, rebase it on
`main` rather than letting it drift.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), in English, in the
imperative mood, with the feature package as the scope.

```
<type>(<scope>): <description>

[optional body explaining why]

[optional footer, e.g. Closes #12]
```

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`,
`chore`, `style`, `revert`.

Scopes are the feature packages (`auth`, `nutrition`, `activity`, `season`,
`mission`, `pair`, `feed`, `gamification`, `progress`, `tdee`, `mealvision`,
`ai`, `notification`, `dashboard`, `user`, `tenant`, `shared`) plus `frontend`,
`infra`, `ci`, `docs`, `deps`.

Good:

```
feat(auth): add refresh token rotation
fix(nutrition): correct macros per serving for non-100g portions
test(tdee): cover the Mifflin-St Jeor formula
```

Bad: `update stuff`, `fixes`, `WIP`, `feat: changes to the auth thing and also
the frontend`.

Write the body when the change is not self-explanatory. Explain **why**, since
the diff already shows what changed. Mention known debt the change leaves
behind.

Commits are squashed on merge, so the pull request title is what ends up in the
history. It follows the same convention.

Do not credit tooling as an author. Commits carry the human contributor only.

## Pull requests

1. Fill in the pull request template. Do not delete its sections.
2. One pull request does one thing. If it needs the word "and" in the title
   twice, split it.
3. CI has to be green. A red check blocks the merge.
4. Include evidence, not claims. A bug fix shows the test failing before and
   passing after, with both outputs pasted. A UI change shows a screenshot.
   Numbers come from command output.
5. State the result of the security checklist from
   [CLAUDE.md](CLAUDE.md#8-security-checklist), even when nothing is wrong.
6. Update `docs/features/<name>.md` in the same pull request if a feature
   changed. Add an ADR under `docs/adr/` if an architectural decision was made.
7. Merge is **squash only**. The branch is deleted afterwards.

Before opening the pull request:

```bash
./mvnw verify

cd frontend && npm run lint && npm run build
```

## Database migrations

Migrations are Flyway SQL files in `src/main/resources/db/migration/`, named
`V<n>__<snake_case_description>.sql`. The number is the next free integer.

Two rules, both absolute:

**A migration that has already run is immutable.** Never edit, renumber or
delete a migration that has been applied anywhere, including on another
contributor's machine. Flyway validates checksums and will refuse to start. Fix
a mistake with a new migration.

**Schema changes are expand/contract.** The application must survive being
rolled back to the previous version while the new schema is already in place,
because deployments roll code back and databases forward.

Renaming a column, done right:

1. _Expand_: add the new column. Nullable, or with a default. Deploy.
2. _Migrate_: write to both columns, read from the new one, backfill the
   existing rows. Deploy.
3. _Contract_: in a later release, once nothing reads the old column, drop it.

What this forbids in a single release: dropping or renaming a column or table in
place, adding a `NOT NULL` column with no default to a populated table, and
narrowing a type.

Always test a migration against a database that already has data, not only
against an empty one.

## Internationalisation

User-facing strings are never hardcoded in a component. They live in
`frontend/src/locales/<namespace>.ts`, one module per namespace, each exporting
all four supported languages:

```ts
export const example = {
  pt: { title: 'Título' },
  en: { title: 'Title' },
  es: { title: 'Título' },
  fr: { title: 'Titre' },
}
```

Rules:

- A new key is added to **all four** languages in the same commit. A missing
  language is a bug, not a follow-up.
- `pt` is the reference. The other three are translations of it, so write `pt`
  first.
- Keys are English, camelCase, and describe the role of the string
  (`submitButton`), not its current text (`clickHere`).
- A new namespace is registered in `frontend/src/locales/index.ts`.
- Do not machine-translate blindly. The product's voice is informal and
  competitive; keep that tone in every language.

Backend exception messages aimed at end users are still Portuguese. Leave them
as they are until they are replaced by error codes translated on the frontend.

## Code style

- Java: 4 spaces, 120 column limit. TypeScript, JSON, YAML, Markdown: 2 spaces.
  UTF-8 and LF everywhere. `.editorconfig` enforces this; use an editor that
  reads it.
- Code, comments and documentation in English. See
  [CLAUDE.md](CLAUDE.md#2-language-policy).
- Respect the hexagonal boundaries described in
  [CLAUDE.md](CLAUDE.md#5-architecture-rules). A cross-layer import is a
  rejected pull request, not a nitpick.

## Reporting bugs and proposing features

Open an issue using the appropriate template. For a bug, include the steps to
reproduce, what you expected, what happened, and the environment. For a feature,
describe the problem before the solution.

Never report a security vulnerability in a public issue. Follow
[SECURITY.md](SECURITY.md).

## Code of conduct

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).
