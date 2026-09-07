# ADR 0003: Publish the source under the Business Source License 1.1

- **Status**: Accepted
- **Date**: 2026-09-05
- **Deciders**: Alisson Souto
- **Supersedes**: nothing
- **Superseded by**: nothing

## Context

The repository serves two purposes at once. It is a portfolio: a junior or
mid-level developer's evidence that they can build, test, secure and operate a
real system, which only works if the code is readable by anyone. It is also the
codebase of a product meant to be sold as a service, which only works if a
competitor cannot take the code and run it as their own service.

Before this decision the repository was private and had no `LICENSE` file at
all, which in most jurisdictions means all rights reserved and, on GitHub, no
licence badge and no clarity for a reader.

## Decision

The code is published under the **Business Source License 1.1** with these
parameters:

- Licensor: Alisson Souto.
- Licensed Work: VitalPair.
- Additional Use Grant: non-production use, personal use, educational use and
  evaluation are permitted.
- Change Date: four years after each version's release.
- Change License: Apache License 2.0.

Anyone can read, study, run locally and learn from the code. Nobody may offer
it as a hosted service to third parties until the change date, when each
version becomes Apache 2.0.

## Alternatives considered

### Option A: a permissive licence (MIT, Apache 2.0)

Rejected. It would let anyone deploy the product commercially the day the
repository went public. For a pure portfolio that is fine; for a product it
gives away the only asset.

### Option B: AGPL 3.0

Considered seriously. It forces anyone running the service to publish their
modifications, which discourages commercial copying without forbidding it. It
was rejected because the goal is not to build a copyleft community but to keep
the option of a proprietary service open, and AGPL would bind the author's own
future commercial version to the same terms.

### Option C: stay private

Rejected. A private repository is not a portfolio.

### Option D: proprietary, all rights reserved, but public

Rejected. It reads as hostile to the very readers the portfolio is for, and
GitHub shows no licence, which looks like an oversight rather than a choice.

## Consequences

### What this makes easier

The repository can be public today. The licence is well known (MariaDB,
CockroachDB, Sentry use it), so readers understand it without a lawyer. The
Apache 2.0 change date is a credible promise that the code is not locked away
forever.

### What this makes harder

BUSL is not an open-source licence by the OSI definition, so the project cannot
be listed as open source, and some companies' policies forbid contributing to
or depending on BUSL code. Contributions from others are unlikely, which is
acceptable: there is one developer.

### What has to change

`LICENSE` at the repository root with the parameters above. The OpenAPI document
and the README link to it. `SECURITY.md` and `CONTRIBUTING.md` reference it.

## Verification

- `LICENSE` exists and names the licensor, licensed work, additional use grant,
  change date and change licence.
- The GitHub repository page shows "BUSL-1.1" in the sidebar.
- `GET /v3/api-docs` carries `info.license.name = "BUSL-1.1"`.

## References

- https://mariadb.com/bsl11/
- `LICENSE`
