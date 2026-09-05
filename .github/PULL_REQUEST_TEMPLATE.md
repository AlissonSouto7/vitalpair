<!--
Title follows Conventional Commits, since the squashed commit uses it:
  feat(auth): add refresh token rotation
Fill in every section. Delete a section only if it genuinely does not apply,
and say why.
-->

## What and why

<!-- What changes, and what problem it solves. Not a list of the files you touched. -->

Closes #

## How to verify

<!-- Steps a reviewer follows to see it working: commands, routes, credentials. -->

## Evidence

<!--
Paste real output. Not a description of the output, the output.
For a bug fix, both runs are required.
-->

**Before**

```
```

**After**

```
```

<!-- Screenshots for UI changes, before and after. -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor with no behaviour change
- [ ] Breaking change
- [ ] Documentation
- [ ] Build, CI or infrastructure

## Checklist

- [ ] `./mvnw verify` passes locally
- [ ] `npm run lint && npm run build` passes in `frontend/`, or the frontend was not touched
- [ ] New behaviour is covered by tests
- [ ] A bug fix has a test that failed before the fix and passes after it, with both outputs above
- [ ] A test that passed on the first run was verified as non-vacuous by breaking the code on purpose
- [ ] Comments and documentation are in English, with no assistant voice and no emoji
- [ ] `docs/features/<name>.md` created or updated, or no feature changed
- [ ] An ADR was added, or no architectural decision was made

## Database

- [ ] No migration in this pull request

If there is a migration:

- [ ] It is a new file; no already-applied migration was edited or renumbered
- [ ] It is expand/contract: the previous application version still runs against this schema
- [ ] It was tested against a database that already had data
- [ ] Every new query is scoped by the owning user or tenant

## Security

<!--
Report the result even when nothing is wrong. Say what you checked.
Full checklist: CLAUDE.md section 8.
-->

- [ ] Input is validated on the server, not only in the browser
- [ ] Authorization is checked per object, not only per route
- [ ] No secret, token or personal data reaches a log, a response or a commit
- [ ] New public or expensive endpoints are rate limited, or none were added
- [ ] New environment variables are documented in `.env.example` with a placeholder
- [ ] Concurrency was considered for anything touching money, stock or external state

Findings outside the scope of this pull request (report them even if unfixed):

## Known debt

<!-- What this change knowingly leaves behind, and when it is meant to be addressed. -->
