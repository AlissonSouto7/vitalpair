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

| Status | Meaning |
|---|---|
| Proposed | Written, not yet agreed |
| Accepted | In force |
| Deprecated | No longer applies, and nothing replaced it |
| Superseded | Replaced by a later ADR, named in the header |

## Index

| # | Title | Status | Date |
|---|---|---|---|
| [0001](0001-arquitetura-hexagonal.md) | Hexagonal architecture (ports and adapters) per feature | Accepted | 2025-06-21 |

<!--
ADR 0001 is still written in Portuguese. It predates the English-only policy and
is scheduled for translation. Every ADR from 0002 onwards is written in English.
-->
