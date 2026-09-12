# ADR 0011: Deploy from the pipeline, with production behind an approval

- **Status**: Accepted
- **Date**: 2026-09-11
- **Deciders**: Alisson Souto
- **Supersedes**: nothing; it builds on [ADR 0009](0009-one-edge-proxy-and-one-stack-per-environment.md)
- **Superseded by**: nothing

## Context

Until this decision a release was a person holding an SSH session: building both
images on the server, running `deploy.sh`, reading the output. It worked, and
the first real deploy of the paid-plan gate was done exactly that way.

Three things were wrong with it. Building on the server made every deploy depend
on whichever checkout happened to be in `~/vitalpair` at the time. The person
had to remember the order, and the order matters (backup, then pull, then up,
then smoke). And nothing connected the tests to the deploy: a merge whose tests
had failed could still be deployed by hand, because the hand does not check.

The server is arm64 (Oracle's A1 free shape) and CI runs on amd64, which is why
building on the server was the original answer: the images have to match the
machine. GitHub now offers arm64 runners free for public repositories, which
removes that constraint.

## Decision

**A merge to `main` deploys staging on its own. A `v*` tag deploys production,
but only after a person approves it in the run.**

`ci.yml` gained `workflow_call` and `cd.yml` calls it, so a deploy runs the same
checks a pull request does rather than a copy of them.

Images are built once, on `ubuntu-24.04-arm`, and tagged with the commit. The
tag deploy and the `main` deploy before it are therefore the same image:
production runs the bytes staging proved, not a rebuild of the same source that
could differ in a dependency resolved on a different day.

The server pulls from GHCR using the run's own `GITHUB_TOKEN`, which expires
when the run ends, and logs out afterwards.

A composite action holds the deploy steps, so staging and production cannot
drift apart: production's first run follows a path staging has taken dozens of
times.

The scripts come from the commit being deployed, so a change to `deploy.sh`
takes effect with the release that contains it.

## Alternatives considered

**Keep building on the server.** Rejected once arm64 runners became free: the
dependency on the server's checkout was the main problem and it disappears.

**Deploy production automatically on a tag.** Rejected. Production is a
decision, and the approval is asked when the build is already tested and
waiting rather than as a promise about one that might work. The two stacks share
one machine, which raises the cost of a wrong production deploy above the cost
of one click.

**`workflow_run` instead of `workflow_call`.** Rejected: it produces two
separate runs with no visible link, and reading whether a deploy had passing
tests means opening a second page.

**A long-lived registry credential on the server.** Rejected: one more thing to
rotate and one more thing to leak, for a registry only this pipeline writes to.

**Staging behind an approval too.** Rejected. Every merge should reach staging
without ceremony, or nobody trusts what is there.

## Consequences

Good: a deploy is repeatable, the images are the tested ones, production cannot
happen by accident, and the run's summary records which images the server says
it is running.

Bad: the pipeline is now a dependency of releasing. GitHub Actions being down
means no deploy, and the manual path (`deploy.sh` over SSH) stays documented in
[the runbooks](../runbooks/deploy.md) for exactly that.

Unproven: the production job has never run, because production has never been
started. Its first execution will be its first test, which is the reason it
shares every step with staging rather than having its own.
