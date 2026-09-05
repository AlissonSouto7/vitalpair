# Feature documentation

One document per feature, kept alive alongside the code. The audience is the
person who joins later and needs to understand a feature without reading every
file in its package.

## The rule

**A pull request that changes a feature updates that feature's document in the
same pull request.** Not afterwards, not when there is time. A document that
lags behind the code is worse than no document, because it is trusted and wrong.

A new feature gets its document created in the pull request that introduces it.

## How to write one

Copy [_template.md](_template.md) to `<feature-name>.md`, matching the backend
package name, and fill it in.

The sections that carry the weight:

- **Business rules**, each with the reason it exists. A rule with no stated
  reason is a rule someone deletes during a refactor.
- **Security findings**, with an id, a severity and a measured impact. Findings
  stay in the document after they are fixed. The "verified and fine" subsection
  matters as much as the others: it stops the next person from re-investigating
  something already checked.
- **What is not covered** under tests. A document that only describes the happy
  path is not worth writing. The value is in naming the holes.

Write it in English.

## Status

No feature documents exist yet. They are written as each feature is next
touched, and backfilled for the larger ones.

Backend feature packages, by class count on `main`:

| Package | Classes | Document |
|---|---|---|
| `ai` | 63 | not written |
| `auth` | 45 | not written |
| `nutrition` | 41 | not written |
| `gamification` | 41 | not written |
| `mission` | 36 | not written |
| `notification` | 31 | not written |
| `mealvision` | 26 | not written |
| `season` | 26 | not written |
| `feed` | 23 | not written |
| `pair` | 23 | not written |
| `activity` | 19 | not written |
| `progress` | 19 | not written |
| `user` | 19 | not written |
| `dashboard` | 9 | not written |
| `tdee` | 5 | not written |
| `workout` | placeholder | not written |

`config`, `shared` and `tenant` are infrastructure packages, not features, and
do not get feature documents.

<!--
Counts measured on main@ad9203d with:
  for d in src/main/java/com/aps/vitalpair/*/; do
    echo "$(basename "$d"): $(find "$d" -name '*.java' | wc -l)"
  done
Update them when they stop being roughly right; they exist to show relative
size, not to be exact.
-->
