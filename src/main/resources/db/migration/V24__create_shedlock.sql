-- Lock table for scheduled jobs.
--
-- The two notification jobs run on a cron and write a notification per user. With a single
-- instance that is fine. The moment a second one runs, whether from a rolling deploy or from
-- scaling out, both fire at the same minute and every user receives the notification twice.
--
-- ShedLock turns the schedule into a lock: whichever instance grabs the row runs the job, the
-- others skip it. The lock lives in the database rather than in memory precisely because the
-- instances share nothing else.

CREATE TABLE shedlock (
    name       VARCHAR(64)  NOT NULL,
    lock_until TIMESTAMP(3) NOT NULL,
    locked_at  TIMESTAMP(3) NOT NULL,
    locked_by  VARCHAR(255) NOT NULL,
    PRIMARY KEY (name)
);
