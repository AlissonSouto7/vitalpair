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

Every backend feature package has a document. Counts measured on 2026-09-06.

| Package        | Classes | Document                                                       |
| -------------- | ------- | -------------------------------------------------------------- |
| `ai`           | 64      | [ai-plans.md](ai-plans.md)                                     |
| `auth`         | 45      | [auth.md](auth.md)                                             |
| `nutrition`    | 42      | [nutrition.md](nutrition.md)                                   |
| `gamification` | 41      | [gamification.md](gamification.md)                             |
| `mission`      | 36      | [missions.md](missions.md)                                     |
| `notification` | 31      | [notifications.md](notifications.md)                           |
| `mealvision`   | 27      | [meal-vision.md](meal-vision.md)                               |
| `season`       | 26      | [season.md](season.md)                                         |
| `feed`         | 23      | [feed.md](feed.md)                                             |
| `pair`         | 23      | [pair.md](pair.md)                                             |
| `activity`     | 19      | [activity.md](activity.md)                                     |
| `progress`     | 19      | [progress.md](progress.md)                                     |
| `user`         | 19      | [user-profile.md](user-profile.md)                             |
| `dashboard`    | 9       | [dashboard.md](dashboard.md)                                   |
| `tdee`         | 5       | [user-profile.md](user-profile.md), with the feature it serves |
| `admin`        | 1       | [admin.md](admin.md)                                           |

`config`, `shared` and `tenant` are infrastructure packages, not features. The
cross-cutting documents are [testing.md](testing.md),
[observability.md](observability.md),
[frontend-foundation.md](frontend-foundation.md) and
[browser-tests.md](browser-tests.md).

<!--
Counts measured with:
  for d in src/main/java/com/aps/vitalpair/*/; do
    echo "$(basename "$d"): $(find "$d" -name '*.java' | wc -l)"
  done
They exist to show relative size, not to be exact.
-->
