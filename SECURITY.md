# Security Policy

## Project status

VitalPair is pre-1.0 and under active development. It is not yet running in
production and has no public users. Treat every release before `v1.0.0` as
experimental: interfaces, storage formats and security controls still change
between minor versions.

## Supported versions

Only the latest release on `main` receives security fixes. Older tags are not
patched.

| Version                  | Supported |
| ------------------------ | --------- |
| Latest release on `main` | Yes       |
| Any earlier tag          | No        |

## Reporting a vulnerability

Do not open a public issue for a security problem, and do not disclose it on
social media or in a pull request before it is fixed.

Report it privately through GitHub: go to the repository's **Security** tab and
use **Report a vulnerability** (private vulnerability reporting). If that is
unavailable, email contato@vitalpair.app with `[SECURITY]` in the subject.

Include whatever you have:

- What the problem is and which component it affects.
- Steps to reproduce, or a proof of concept.
- The impact you believe it has, and any conditions required to trigger it.
- The version, commit SHA or environment you tested against.

### What to expect

This is a single-maintainer project, so response times are best effort:

- Acknowledgement within 5 business days.
- An initial assessment (severity, whether it is reproducible) within 10
  business days.
- A fix or a mitigation plan communicated before public disclosure.

You will be credited in the release notes unless you ask not to be.

### Safe harbour

Good-faith security research on your own installation is welcome. Do not test
against infrastructure you do not own, do not access, modify or exfiltrate data
belonging to other people, and do not run denial-of-service or spam tests.

## Scope

In scope: the backend (`src/`), the frontend (`frontend/`), deployment
configuration, CI workflows, and the dependencies declared in `pom.xml` and
`frontend/package.json`.

Out of scope: findings that require an already-compromised host, issues in
third-party services themselves (report those upstream), missing hardening
headers with no demonstrated impact, and automated scanner output with no
working proof of concept.

## Known open issues

Hardening is scheduled work, not an oversight. These are tracked and being
addressed:

- There is no fine-grained role model yet: apart from the single ADMIN flag,
  granted only by a database update, every authenticated user has the same
  permissions.
- Registration answers differently for an address that already has an account
  (422) and a new one (201), so the endpoint can be used to tell which e-mails
  are registered. Rate limiting slows a scan but does not prevent it; moving to
  a verify-first flow that always answers the same is the fix.

Earlier releases listed unauthenticated endpoints with no rate limiting, a
hardcoded development JWT secret, reset tokens written to the log, and OpenAPI
served in production. All four are closed: authentication and the paid
endpoints are rate limited (`RateLimitFilter`), the development secret is
generated per run (`DevJwtSecretGenerator`), the mail adapter never logs the
link, and OpenAPI is disabled in production and refused at the edge.

## Secrets

Secrets never belong in the repository. Configuration comes from environment
variables; `.env` and `.env.*` are gitignored, and `.env.example` documents the
required variables with placeholder values only. If you believe a secret has
been committed, report it privately as described above rather than opening an
issue.
