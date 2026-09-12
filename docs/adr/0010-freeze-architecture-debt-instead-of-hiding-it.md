# ADR 0010: Enforce architecture rules with ArchUnit and freeze pre-existing violations instead of weakening the rules

- **Status**: Accepted
- **Date**: 2026-09-07
- **Deciders**: Alisson Souto
- **Supersedes**: nothing
- **Superseded by**: nothing

## Context

ADR 0001 states the dependency rule `infrastructure -> application -> domain`
and that features do not import each other's internals. Earlier these
were sentences in a document. When the rules became ArchUnit tests, the code
did not fully satisfy them, and it still does not:

- The feature-cycle rule found **6 cycles** between packages (measured on
  2026-09-05; three through `config`, three genuine, such as `progress` and
  `user` depending on each other).
- A rule added on 2026-09-07, "the domain does not depend on the application
  layer", found **28 violations**: inbound ports whose return types are
  `application.dto` records, which has been the convention since the first
  feature.

Each finding presented the same choice: fix everything before the rule can
exist, drop the rule, or weaken it until the code passes.

## Decision

Rules are written as they should be, and violations that already exist when a
rule is introduced are **frozen** with ArchUnit's `FreezingArchRule`. The
freeze store lives in `src/test/resources/archunit_store/` and is versioned.
A frozen violation is accepted; a new one fails the build. The store may
shrink, never grow: when a violation is removed, the next test run removes it
from the store automatically.

Every freeze is recorded where the rule is defined, with the count and the
date, and in `docs/ARCHITECTURE.md`, so the debt is visible rather than hidden
in a configuration file.

Nine rules are in force: the domain imports no framework; the domain does not
depend on the application layer (frozen at 28); the application does not depend
on infrastructure; web does not depend on persistence; controllers live in
`..infrastructure.web..`; entities live in `..infrastructure.persistence..`;
transactions are declared in the application layer; no console output;
features are free of cycles (frozen at 6).

## Alternatives considered

### Option A: fix all violations before adding each rule

Rejected. Moving 28 DTOs across most features is a refactor of its own, with
its own review, and gating a safety net on it means no safety net for weeks.
The freeze gives the guarantee that matters immediately: the number cannot go
up.

### Option B: weaken the rule so the current code passes

Rejected. A rule that permits `domain -> application.dto` is not the rule ADR
0001 states; it is a different architecture with the old name. The document
would then describe something the code does not do, which is the situation the
tests exist to end.

### Option C: keep the rules as documentation only

Rejected. It is what existed earlier, and the "zero violations" the
original audit reported was wrong on both counts.

### Option D: exclude the violating packages from the rule

Rejected. An exclusion is a freeze with no count, no date and no path back.

## Consequences

### What this makes easier

The build says exactly what the architecture is, including its debt. The rule
has already caught real regressions: a cycle once introduced (a role type
placed in `user`, creating `user <-> shared`) failed the build and was moved;
a probe violation planted on 2026-09-07 was caught as the 29th.

### What this makes harder

The store's entries carry class and method signatures, so changing the
signature of a class inside a frozen violation makes the entry stale and the
build fails until the entry is refreshed, even though the debt did not grow.
This happened when `PairService` gained a constructor parameter. Refreshing is
`freeze.refreeze=true` in `archunit.properties` for one test run, and the
diff of the store shows whether anything but the signature changed.

### What has to change

`HexagonalArchitectureTest`, `archunit.properties`, the store directory, and
a note in `ARCHITECTURE.md` per frozen rule.

## Verification

- `./mvnw test -Dtest=HexagonalArchitectureTest`: 9 rules pass.
- `grep -c "Cycle detected" src/test/resources/archunit_store/*`: 6.
- Add any class in a `..domain..` package that references a type in
  `..application..`: the build fails naming it.

## References

- ADR 0001
- `src/test/java/com/aps/vitalpair/architecture/HexagonalArchitectureTest.java`
- ArchUnit documentation, "Freezing Arch Rules".
