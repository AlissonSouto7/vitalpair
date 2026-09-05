# Feature: <name>

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: in development | shipped | deprecated
- **Owner**: who to ask
- **Last updated**: YYYY-MM-DD

## What it is and where it lives

One paragraph on what the feature does for the user.

| | |
|---|---|
| Frontend route | `/example` |
| Who can access it | authenticated user, pair member, admin, anonymous |
| Backend package | `com.aps.vitalpair.<feature>` |
| Feature flag | none, or the flag that gates it |

## Architecture

| Layer | Files |
|---|---|
| Route | |
| Controller | |
| Use case port | |
| Service | |
| Output ports | |
| Persistence | |
| Frontend page | |
| i18n namespace | |

### Endpoints

| Method | Path | Action | Who can call it |
|---|---|---|---|
| GET | `/api/v1/example` | | |

### Data

Tables and columns this feature owns, and the migrations that created them.

| Table | Created in | Notes |
|---|---|---|

## Business rules

The invariants and the reason each one exists. A rule with no reason is a rule
someone will delete.

| # | Rule | Why |
|---|---|---|
| R-1 | | |

## Security findings

Every finding gets an id, and stays in this document after it is fixed. The
"verified and fine" section matters as much as the others: it stops the next
person from re-investigating something already checked.

### Fixed

| ID | Severity | File | What happened | Measured impact | Fix |
|---|---|---|---|---|---|
| S-1 | | | | | |

### Open

| ID | Severity | File | What happens | Measured impact | Why it is still open |
|---|---|---|---|---|---|
| S-2 | | | | | |

### Verified and fine

What was checked and found sound, so nobody re-checks it.

| Check | How it was verified | Date |
|---|---|---|
| Object-level authorization on every endpoint | | |
| Tenant scope on every query | | |
| No secret or token in logs | | |
| Server-side input validation | | |
| Rate limiting on public endpoints | | |

## Tests

Each test is tied to the risk it protects against. A test whose risk cannot be
named is a test nobody will maintain.

| Test | Type | Risk it covers |
|---|---|---|
| | unit / slice / integration / e2e | |

How to run them:

```bash
```

### What is not covered

Be explicit. This section is the most useful one in the document.

- (list the paths, states and failure modes no test exercises)

## How to verify in production

Read-only commands and queries to confirm the feature is behaving.

```sql
-- read only
```

## Known debt

| Item | Impact | When it is meant to be addressed |
|---|---|---|

## History

| Date | Change | Pull request |
|---|---|---|
| YYYY-MM-DD | Created | #N |
