# ADR 0005: Enforce tenant isolation with explicit query scope and a cross-tenant test, not a Hibernate filter

- **Status**: Accepted
- **Date**: 2026-09-05
- **Deciders**: Alisson Souto
- **Supersedes**: nothing
- **Superseded by**: nothing

## Context

A pair is a tenant. `pairs.id` is the `tenant_id` carried by every business
table, and two pairs must never see each other's data. The AI once
plan tables had no `tenant_id` at all, and a `package-info.java` claimed that
"the persistence layer applies the tenant filter from `TenantContext`", which
was false: no such filter existed. Isolation rested on every query remembering
to filter by the owner, with nothing checking that it did.

Two mechanisms were on the table: make the database or the ORM enforce the
boundary automatically, or make every query explicit and prove the boundary
with a test that tries to cross it.

## Decision

Every query that reads or writes user-owned data takes the owner explicitly:
`userId`, `tenantId`, or both. The tenant is read from the authenticated
principal, never from a request parameter. There is no Hibernate `@Filter`, no
`@Where`, and no row-level security in Postgres.

The boundary is proved by `TenantIsolationIT`, which builds two complete pairs
with distinguishable data (meals, activities, weight, stake, AI plans whose
dish names are prefixed differently) and, for every authenticated read, asserts
the response contains nothing of the other pair; it also attempts the writes a
hostile client would (delete another pair's meal, react to their feed item,
toggle their exercise, join a full pair with a code read from the database).
The test compares its endpoint list against the controllers Spring actually
loaded, so a new controller fails the build until it is covered.

Where a table's `tenant_id` is not needed by any query because `user_id` is
strictly narrower (a user belongs to exactly one pair), the column is still
written, so the foreign key catches a cross-tenant write at the database.

## Alternatives considered

### Option A: Hibernate `@Filter` enabled by a request interceptor

Rejected. The filter is enabled per session, so any code path that opens a
session outside a request, which is exactly what the two scheduled jobs and the
`AFTER_COMMIT` event listeners do, runs unfiltered and silently. A mechanism
that fails open in the background is worse than one that is visibly manual.

### Option B: Postgres row-level security with `SET app.tenant`

Rejected for now. It is the strongest option, but it requires every connection
to set the tenant before any statement, including the ones Flyway, ShedLock and
the schedulers open, and a pooled connection that keeps a stale setting leaks
the other way. It stays the upgrade path if the product gains many tenants and
a second team.

### Option C: a separate schema or database per pair

Rejected. Thousands of schemas for pairs of two people is operational cost with
no benefit at this scale.

## Consequences

### What this makes easier

Every query is readable on its own: what it filters by is in the method name.
The isolation guarantee is a test anyone can run and extend, and it has already
paid for itself: a security pass found the AI plans scoped by user alone, and the first
version of the test passed while the filter was sabotaged, because both pairs
had identical fixture data. The test was made distinguishable and the sabotage
then failed.

### What this makes harder

Nothing stops a new query from forgetting the filter except review and the
integration test. A read added to an existing controller is covered only if the
test's endpoint list is updated. `tenant_id` columns that no query reads exist
on several tables, which looks redundant until the foreign key is the thing that
catches a bug.

### What has to change

`V22` added `tenant_id` to the AI plan tables with an expand/contract
migration. `TenantContext` stays as a ThreadLocal for adapters that need the
tenant outside a use case argument, with its documentation corrected to say
isolation is not automatic.

## Verification

- `./mvnw verify -Dit.test=TenantIsolationIT`: 30 cases.
- Sabotage: remove the tenant predicate from any scoped query and the
  corresponding case fails.
- `docs/features/pair.md` lists the twelve tables that carry `tenant_id` and
  which of them also carry `user_id`, measured from the catalogue.

## References

- `src/test/java/com/aps/vitalpair/tenant/TenantIsolationIT.java`
- `docs/features/pair.md`, `docs/features/testing.md`
- An earlier pass pull request.
