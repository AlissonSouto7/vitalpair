# Feature: notifications

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-06

## What it is and where it lives

In-app notifications: your partner logged something, you were overtaken on the
scoreboard, there is a mission today, you have logged nothing and it is eight in
the evening. Two are reactive, driven by events; two come from scheduled jobs.

Notifications store structured data, not sentences. The row holds an actor name,
a reference string and a number, and the frontend composes the text in the
reader's language.

|                   |                                                                                   |
| ----------------- | --------------------------------------------------------------------------------- |
| Frontend          | the bell in the header, on every authenticated screen; preferences on `/settings` |
| Who can access it | authenticated user, their own notifications                                       |
| Backend package   | `com.aps.vitalpair.notification` (31 classes, 971 lines)                          |
| Feature flag      | none; each automatic type has a per-user preference                               |

## Architecture

| Layer          | Files                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Controllers    | `NotificationController`, `NotificationPreferencesController`                                          |
| Listener       | `notification/application/listener/NotificationEventListener.java`                                     |
| Scheduler      | `notification/application/scheduler/NotificationScheduler.java`                                        |
| Services       | `NotificationService`, `NotificationPreferencesService`                                                |
| Output ports   | `NotificationRepositoryPort`, `NotificationPreferencesRepositoryPort`, `DailyLogMetricsRepositoryPort` |
| Frontend       | `NotificationsBell.tsx`, the preferences block in `SettingsPage.tsx`                                   |
| i18n namespace | `notifications`                                                                                        |

### Endpoints

| Method | Path                            | Action                                         |
| ------ | ------------------------------- | ---------------------------------------------- |
| GET    | `/api/v1/notifications`         | The 30 most recent, plus a global unread count |
| PUT    | `/api/v1/notifications/read`    | Mark all of the caller's as read               |
| GET    | `/api/v1/me/notification-prefs` | The three switches, or their defaults          |
| PUT    | `/api/v1/me/notification-prefs` | Replace all three                              |

### Events and jobs

| Trigger                               | Produces                             | Sent to                                 |
| ------------------------------------- | ------------------------------------ | --------------------------------------- |
| `MealLoggedEvent`                     | `PARTNER_MEAL` with the food name    | the partner, unless the meal is private |
| `ActivityLoggedEvent`                 | `PARTNER_ACTIVITY` with the calories | the partner                             |
| `PairFormedEvent`                     | `PAIR_FORMED`                        | both members                            |
| gamification's overtake transition    | `RIVAL_OVERTOOK`                     | whoever was passed                      |
| `0 0 9 * * *` in `America/Sao_Paulo`  | `FLASH_MISSION`                      | every user in an active pair            |
| `0 0 20 * * *` in `America/Sao_Paulo` | `LOG_REMINDER`                       | every user who logged nothing today     |

Both jobs hold a ShedLock, so a second instance skips a job the first is running
rather than sending every notification twice.

### Data

| Table                      | Created in                                 | Notes                                                                                                                  |
| -------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `notifications`            | `V9__create_notifications.sql`             | Index on `(user_id, created_at DESC)`. `tenant_id` and `user_id` have **no** foreign keys, unlike every other table    |
| structured columns         | `V10__notifications_structured.sql`        | Dropped `title` and `body`, added `actor_name`, `ref_text`, `amount`, so the text is composed in the reader's language |
| `notification_preferences` | `V19__create_notification_preferences.sql` | `user_id` is the primary key; the row is optional and defaults apply without it                                        |
| `shedlock`                 | `V24__create_shedlock.sql`                 |                                                                                                                        |

## Business rules

| #   | Rule                                                                                                          | Why                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| R-1 | The row stores data, not a sentence                                                                           | A sentence written in Portuguese at insert time cannot be read in French later                                                             |
| R-2 | Defaults are rival **on**, mission **on**, reminder **off**                                                   | The first two are about the other person and are the point of the product. A daily reminder that nobody asked for is how an app gets muted |
| R-3 | Only the three automatic types respect a preference; meal, activity and pair notifications are always created | Those three are direct consequences of something the partner did, which is what the pair is for                                            |
| R-4 | A private meal produces no notification                                                                       | The partner would otherwise be told the exact moment a private meal was logged, which is most of what privacy is meant to hide             |
| R-5 | The overtake notification goes to the person who was passed, on the transition only                           | Telling the person who moved ahead is pointless; telling them on every point is noise                                                      |
| R-6 | Both jobs run in `America/Sao_Paulo`, not the server's zone                                                   | A JVM in UTC would fire the nine o'clock notification at six in the morning                                                                |
| R-7 | Both jobs hold a lock and process each user in their own try/catch                                            | A second instance must not double-send, and one user's failure must not stop the job                                                       |
| R-8 | The unread count is global, the list is the most recent 30                                                    | The badge should be true even when the list is not exhaustive. See NT-3                                                                    |

## Security findings

### Open

| ID   | Severity | File                     | What happens                                                                                                                                                                                                       | Measured impact                                                                                                                                            | Why it is still open                                                                                                                 |
| ---- | -------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| NT-1 | Medium   | `NotificationScheduler`  | Both jobs call `userRepository.findAll()` and then query per user: the mission job is `1 + N` queries, the reminder job `1 + 2N`, with every user held in memory                                                   | Fine at two users; it is the first thing that falls over as the product grows. Not measured under load, because no load exists                             | The fix is paging the scan, which is a real change to both jobs and wants a test that would currently have nothing to assert against |
| NT-2 | Low      | `NotificationService`    | There is no cooldown, no dedup and no unique constraint. A partner logging eight meals produces eight notifications, and re-running a job by hand after the one-minute lock expires sends every user a second copy | The lock protects against two instances, not against the same instance running twice                                                                       | A per-day uniqueness key on the scheduled types would fix the second half cheaply                                                    |
| NT-3 | Low      | `NotificationController` | The list is a hardcoded 30 with no pagination. A user with 500 notifications can never reach the 31st, and the unread badge can show a number the list cannot account for                                          | Nobody has 500 yet                                                                                                                                         | Pagination across all list endpoints is one backlog item                                                                             |
| NT-4 | Low      | `NotificationScheduler`  | The mission job skips users whose pair is not `ACTIVE`; the reminder job does not, so someone with no partner still gets the eight o'clock nudge                                                                   | Inconsistent rather than harmful                                                                                                                           | Decide which is right and apply it to both                                                                                           |
| NT-5 | Low      | `notifications`          | `tenant_id` is written on every insert and read by no query; every read filters by `user_id` alone. The column also has no foreign key                                                                             | Not exploitable, since `user_id` is narrower. But V9's stated purpose for the column is not implemented, and a future query that trusted it would be wrong | Either scope the queries by it or drop it                                                                                            |

### Verified and fine

| Check                                        | How it was verified                                                                                              | Date       |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------- |
| A private meal produces no notification      | The listener returns before creating anything; the feed side of the same guarantee is covered by `MealPrivacyIT` | 2026-09-06 |
| The jobs cannot double-send across instances | `SchedulerLockIT.runningAJobTakesTheLockAndASecondRunIsSkipped`                                                  | 2026-09-06 |
| The schedule uses the configured zone        | `SchedulerLockIT.theScheduleUsesTheConfiguredZoneNotTheServersOwn`                                               | 2026-09-06 |
| The lock table exists                        | `SchedulerLockIT.theLockTableExistsForTheJobsToShareIt` asserts its four columns                                 | 2026-09-06 |
| Reads are scoped to the caller               | Every query filters by `user_id` from the principal; `TenantIsolationIT` covers both endpoints                   | 2026-09-06 |
| Preferences validate on the server           | Boxed `Boolean` with `@NotNull`, so a missing field is a 400 rather than a silent false                          | 2026-09-06 |

## Tests

| Test                        | Type        | Risk it covers                                                                                        |
| --------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| `SchedulerLockIT` (3 cases) | integration | R-6 and R-7: duplicate notifications from a rolling deploy, and a UTC server firing at the wrong hour |
| `TenantIsolationIT`         | integration | Cross-pair reads of notifications and preferences                                                     |
| `MealPrivacyIT`             | integration | R-4's visible half                                                                                    |

```bash
./mvnw verify -Dit.test=SchedulerLockIT
```

### What is not covered

- **`suppressedByPreference` has no test**: the entire preference gate, including the early
  return that makes the older types unconditional, is unverified. Turning a preference off
  and still receiving the notification would break no test.
- **`NotificationEventListener` has no test**: neither the private-meal guard nor the
  null-partner guards.
- **The reminder job** is never exercised; only the mission job is, and only for its lock.
- **`markAllRead`** has no test.
- **NT-2**: no test asserts that a job run twice produces one notification, because it does
  not.

## How to verify in production

```sql
-- read only: notifications by type over the last week
SELECT type, count(*) FROM notifications WHERE created_at > now() - interval '7 days' GROUP BY 1;

-- read only: NT-2 becoming visible, two of the same type for one user on one day
SELECT user_id, type, date_trunc('day', created_at) AS day, count(*)
FROM notifications WHERE type IN ('FLASH_MISSION','LOG_REMINDER')
GROUP BY 1,2,3 HAVING count(*) > 1;

-- read only: who turned the reminder on
SELECT count(*) FILTER (WHERE notify_reminder) AS reminder_on, count(*) AS total FROM notification_preferences;

-- read only: NT-5, notifications has no FK, so orphans are silent
SELECT count(*) FROM notifications n LEFT JOIN users u ON u.id = n.user_id WHERE u.id IS NULL;
```

```bash
# read only: did the jobs run, and who holds the lock
psql -c "SELECT name, locked_at, lock_until, locked_by FROM shedlock;"
```

## Known debt

| Item                                          | Impact                                               | When it is meant to be addressed       |
| --------------------------------------------- | ---------------------------------------------------- | -------------------------------------- |
| NT-1, the schedulers scan every user          | The first scaling wall                               | Before more than a handful of users    |
| NT-2, no dedup                                | A hand-run job double-sends                          | With NT-1                              |
| NT-3, no pagination                           | Older notifications are unreachable                  | Backlog, with the other list endpoints |
| NT-4, the two jobs disagree about pair status | Inconsistent                                         | Cheap, next change here                |
| NT-5, `tenant_id` written and never read      | A column that promises isolation it does not provide | Scope the queries or drop it           |
| The preference gate is untested               | The switches could stop working silently             | Highest-value test to add here         |

## History

| Date       | Change                                     | Pull request                    |
| ---------- | ------------------------------------------ | ------------------------------- |
| 2026-09-05 | ShedLock and the scheduling zone (phase 8) | `feat/observability-resilience` |
| 2026-09-06 | Document created (phase 13)                | `docs/professional-docs`        |
