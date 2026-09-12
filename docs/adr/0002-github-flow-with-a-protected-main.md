# ADR 0002: Use GitHub Flow with a protected main and squash merges

- **Status**: Accepted
- **Date**: 2026-09-05
- **Deciders**: Alisson Souto
- **Supersedes**: the Git Flow described in the former `docs/GITFLOW.md`
- **Superseded by**: nothing

## Context

The repository had a `develop` branch, long-lived `feature/*` branches and a
`docs/GITFLOW.md` describing Git Flow with release branches. Measured on
2026-09-05: `main` was at `v0.2.0`, 23 commits behind `develop`, and the largest
feature in the codebase (63 classes, two migrations) had never been committed
anywhere. Continuous integration had never executed a test: the workflow only
ran on `main` and `develop`, and it had been failing in 13 seconds since June
because `mvnw` was committed without the execute bit.

There is one developer, no release cadence, and nothing deployed. Git Flow's
release and hotfix branches exist to coordinate several people shipping on a
schedule, which is not this project.

## Decision

The repository uses GitHub Flow. `main` is the only long-lived branch and is
always releasable. Every change starts from `main` on a short branch named
`<type>/<kebab-description>` (`feat/`, `fix/`, `docs/`, `test/`, `refactor/`,
`build/`, `ci/`, `chore/`), comes back through a pull request, and is merged by
**squash** once the three CI jobs are green. Releases are tags on `main`.

`main` is protected by a ruleset named "main protection": pull request
required, squash the only allowed merge method, no force pushes, no deletion,
and the status checks "Backend build and tests", "Frontend build and tests" and
"Browser tests" required with the strict policy. Merged branches are deleted
automatically. All of this was applied through the GitHub API on 2026-09-07
and can be read back with the commands under Verification.

Squash became the only method after a measured cost of merge commits: GitHub
writes the pull request title into the merge commit's body, release-please
parses that body as a conventional commit, and the 0.4.0 changelog came out
with duplicated entries (18 merge commits since v0.3.0; 11 of them produced a
duplicate, the rest belonged to hidden categories). The duplicates were
removed by hand from the 0.4.0 section; later versions are clean by
construction.

Pull requests opened by release-please are authored by the Actions bot, and
their workflow runs wait for a manual approval (`action_required`) before the
required checks can report. Approving the two runs on the release pull request
is part of cutting a release.

One phase of work is one branch and one pull request. Stacked branches are
merged in order, each rebased onto the new `main` before its own pull request
is opened, because a squash merge changes the hash of the commit the next
branch was built on; a merge commit does not, but the rebase is harmless there
too, so the procedure does not depend on which method was used.

## Alternatives considered

### Option A: keep Git Flow

Rejected. Its extra branches coordinate a team and a release schedule that do
not exist here, and in practice they had produced a `develop` that nobody
merged to `main` for 23 commits.

### Option B: trunk-based development, committing straight to main

Rejected. Direct commits skip the pull request, and the pull request is where
the evidence lives: the template asks for the failing test, the passing test and
the security checklist. Without it, "done" would again mean "it compiles".

### Option C: merge commits instead of squash

Rejected. A phase's branch typically carries one meaningful commit plus fixups;
squash keeps one commit per pull request on `main`, which is what
`release-please` reads to write the changelog and pick the next version.

## Consequences

### What this makes easier

Every change on `main` has passed the full build, including the integration and
browser suites. The history is one commit per pull request, readable and
bisectable. A release is `git tag`, nothing more.

### What this makes harder

Long-running work has to be split into mergeable pieces, or it sits on a branch
that drifts. Stacked branches need a rebase after each merge. Both were felt
during a stretch where six pull requests waited on one review.

### What has to change

`docs/GITFLOW.md` was deleted; branching rules moved to `CONTRIBUTING.md`.
`develop` and the old `feature/*` branches were deleted after being merged
fast-forward into `main`. The CI workflow runs on every pull request to `main`.

## Verification

- `gh api repos/AlissonSouto7/vitalpair/rulesets` lists "main protection" as
  active on the `main` branch.
- `gh api repos/AlissonSouto7/vitalpair --jq '{squash:.allow_squash_merge, merge_commit:.allow_merge_commit, auto_delete:.delete_branch_on_merge}'`
  shows the merge-method and auto-delete settings; the target state is squash
  only and auto-delete on.
- `git branch -r` shows no `develop`.

## References

- `CONTRIBUTING.md`, branching and pull request sections.
- An earlier pass and an earlier pass pull requests, #1 to #4.
