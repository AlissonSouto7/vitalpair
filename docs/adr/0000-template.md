# ADR 0000: Title in one line, as a decision

- **Status**: Proposed
- **Date**: YYYY-MM-DD
- **Deciders**: who made the call
- **Supersedes**: ADR 000X, or nothing
- **Superseded by**: nothing, until something does

<!--
Status moves through: Proposed -> Accepted -> Deprecated or Superseded.
An accepted ADR is never edited to change the decision. It is superseded by a
new one, and both stay in the repository. The record of a wrong decision is
worth as much as the record of a right one.

The title states the decision, not the topic:
  good: "Store the refresh token in an httpOnly cookie"
  bad:  "Token storage"
-->

## Context

What is true today that forces a choice. Constraints, requirements, and the
measurements that back them. State facts, not preferences. If a number appears
here, say where it came from.

## Decision

What was decided, in the present tense and the active voice: "The refresh token
is stored in an httpOnly cookie scoped to `/api/v1/auth`."

Be specific enough that someone can implement it from this paragraph alone.

## Alternatives considered

Every option that was genuinely on the table, and the reason it lost. An ADR
with no rejected alternatives usually means the decision was never actually
made.

### Option A: name

What it is, and why it was not chosen.

### Option B: name

What it is, and why it was not chosen.

## Consequences

### What this makes easier

### What this makes harder

Including the costs accepted knowingly. This section is the reason ADRs exist:
it is what the next person needs when the decision starts to hurt.

### What has to change

Code, configuration, deployment, documentation and tests affected.

## Verification

How anyone can confirm the decision is actually in force: a test, a command, a
grep, an architecture rule.

## References

Links to issues, pull requests, documentation or articles that informed this.
