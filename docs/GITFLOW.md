# Git Flow do VitaPair

O projeto usa **Git Flow** (extensão AVH). Este documento define o modelo de branches, as convenções de commit/tag e os comandos do dia a dia.

## Modelo de branches

| Branch | Origem | Merge em | Papel |
|---|---|---|---|
| `main` | — | — | Produção. Só recebe merge de `release/*` e `hotfix/*`. Todo commit aqui é uma versão e leva uma tag. |
| `develop` | `main` | — | Integração. Onde as features se juntam para a próxima versão. |
| `feature/*` | `develop` | `develop` | Uma funcionalidade nova. |
| `release/*` | `develop` | `main` + `develop` | Preparação de uma versão (ajustes finais, bump de versão). |
| `hotfix/*` | `main` | `main` + `develop` | Correção urgente em produção. |
| `bugfix/*` | `develop` | `develop` | Correção de bug encontrado durante o desenvolvimento. |

Regra de ouro: **nunca commitar direto em `main` nem em `develop`**. O trabalho acontece nas branches `feature/`, `release/`, `hotfix/` e `bugfix/`.

## Configuração (já feita neste repositório)

```bash
git flow init -d        # production=main, develop=develop, prefixos padrão, tag=v
```

Conferir: `git flow config`.

## Fluxo de uma funcionalidade

```bash
git flow feature start nome-da-feature      # cria feature/nome-da-feature a partir de develop
# ... commits ...
git flow feature finish nome-da-feature     # merge em develop e remove a branch
```

Equivalente sem a extensão:

```bash
git checkout develop && git pull
git checkout -b feature/nome-da-feature
# ... commits ...
git checkout develop
git merge --no-ff feature/nome-da-feature
git branch -d feature/nome-da-feature
```

> Trabalhando com Pull Request no GitHub: em vez de `feature finish`, publique a branch
> (`git flow feature publish nome-da-feature`) e abra o PR para `develop`. O merge é feito pelo PR.

## Fluxo de release

```bash
git flow release start 0.1.0       # cria release/0.1.0 a partir de develop
# ajustes finais + bump de versão (pom.xml)
git flow release finish 0.1.0      # merge em main (com tag v0.1.0) e de volta em develop
```

## Fluxo de hotfix

```bash
git flow hotfix start 0.1.1        # a partir de main
# correção
git flow hotfix finish 0.1.1       # merge em main (tag v0.1.1) e em develop
```

## Convenções

### Commits (Conventional Commits)

`tipo(escopo opcional): descrição no imperativo`

Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `build`, `ci`.

Exemplos:
- `feat(auth): adiciona login com Google`
- `fix(nutrition): corrige cálculo de macros por porção`
- `test(tdee): cobre fórmula Mifflin-St Jeor`

### Versões (SemVer)

`vMAJOR.MINOR.PATCH` — ex.: `v0.1.0`. Tags são criadas automaticamente pelo `release finish`/`hotfix finish`.

- MAJOR: mudança incompatível de API.
- MINOR: nova funcionalidade compatível.
- PATCH: correção compatível.

## Estado atual

A `develop` foi criada a partir da `main` (que já contém o setup inicial e a feature de autenticação). A partir daqui, todo desenvolvimento segue o fluxo acima. A primeira release marcará o MVP da Fase 1.
