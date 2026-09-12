# Architecture Decision Records

An ADR records one architectural decision: what was decided, what the situation
was that forced the choice, which alternatives lost, and what the decision costs.

They exist because the reason behind a decision disappears faster than the code
that implements it. Six months later the code says what was built, and only the
ADR says why the obvious-looking alternative was rejected.

## When to write one

Write an ADR when a decision is expensive to reverse or hard to infer from the
code:

- Choosing or dropping a framework, library or external service.
- Anything that changes the shape of the architecture: layering, module
  boundaries, communication between features.
- Storage decisions: where a credential lives, how tenancy is enforced, the
  shape of a core table.
- Cross-cutting policy: logging, error handling, resilience, rate limiting.
- Deployment topology and release strategy.
- A decision made against the obvious choice, where the next person would
  otherwise "fix" it back.

Do not write one for routine work. A new endpoint that follows the existing
pattern, a bug fix, a refactor with no behavioural change: those belong in the
pull request, not here.

## How to write one

1. Copy [0000-template.md](0000-template.md) to
   `NNNN-short-kebab-case-title.md`, where `NNNN` is the next free number.
2. Title it as the decision, not the topic. "Store the refresh token in an
   httpOnly cookie", not "Token storage".
3. Fill in every section. The alternatives section is the one that matters: an
   ADR with no rejected options usually documents a decision nobody actually
   made.
4. Open it as `Proposed` in the pull request that implements it, and set it to
   `Accepted` when that pull request is merged.

## Rules

- **An accepted ADR is never rewritten to change its decision.** When a decision
  is reversed, write a new ADR that supersedes it and mark the old one
  `Superseded by ADR NNNN`. Both stay in the repository. Typos and broken links
  can be fixed.
- Numbers are never reused, even if an ADR is abandoned.
- ADRs are written in English.

## Status values

| Status     | Meaning                                      |
| ---------- | -------------------------------------------- |
| Proposed   | Written, not yet agreed                      |
| Accepted   | In force                                     |
| Deprecated | No longer applies, and nothing replaced it   |
| Superseded | Replaced by a later ADR, named in the header |

## Index

| #                                                                           | Title                                                                                            | Status   | Date       |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------- | ---------- |
| [0001](0001-arquitetura-hexagonal.md)                                       | Hexagonal architecture (ports and adapters) per feature                                          | Accepted | 2025-06-21 |
| [0002](0002-github-flow-with-a-protected-main.md)                           | Use GitHub Flow with a protected main and squash merges                                          | Accepted | 2026-09-05 |
| [0003](0003-source-available-under-busl-1.1.md)                             | Publish the source under the Business Source License 1.1                                         | Accepted | 2026-09-05 |
| [0004](0004-refresh-token-in-an-httponly-cookie.md)                         | Store the refresh token in an HttpOnly cookie and rotate it in families                          | Accepted | 2026-09-05 |
| [0005](0005-tenant-isolation-by-explicit-query-scope.md)                    | Enforce tenant isolation with explicit query scope and a cross-tenant test                       | Accepted | 2026-09-05 |
| [0006](0006-request-correlation-and-structured-logs.md)                     | Correlate every request with an id and log structured JSON in production                         | Accepted | 2026-09-05 |
| [0007](0007-resilience-policy-for-external-calls.md)                        | Circuit-break both external APIs, retry only Open Food Facts, never count a refusal as an outage | Accepted | 2026-09-05 |
| [0008](0008-frontend-data-layer-and-routing.md)                             | Load each route on demand, keep server state in TanStack Query, one error reader                 | Accepted | 2026-09-06 |
| [0009](0009-one-edge-proxy-and-one-stack-per-environment.md)                | Deploy as one edge proxy per machine and one Compose stack per environment                       | Accepted | 2026-09-06 |
| [0010](0010-freeze-architecture-debt-instead-of-hiding-it.md)               | Enforce architecture rules with ArchUnit and freeze pre-existing violations                      | Accepted | 2026-09-07 |
| [0011](0011-deploy-from-the-pipeline-with-production-behind-an-approval.md) | Deploy from the pipeline; staging on a merge, production behind an approval                      | Accepted | 2026-09-11 |

<!--
ADR 0001 is still written in Portuguese. It predates the English-only policy and
is kept as written: an accepted ADR is not rewritten. Its content is restated in
English in docs/ARCHITECTURE.md. Every ADR from 0002 onwards is written in English.
-->
