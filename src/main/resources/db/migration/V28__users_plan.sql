-- Who pays for the AI features.
--
-- The plan lives on the person who bought it, not on the pair: a pair ends and the person
-- who paid keeps what they paid for. While the pair is active the partner shares it, which
-- is a rule the application applies at read time, so nothing here changes when a pair
-- forms or ends.
--
-- Two columns rather than a boolean: PREMIUM with no expiry is a lifetime plan (the two
-- test accounts, for now); PREMIUM with an expiry is what a subscription will write once
-- billing exists. FREE ignores the expiry.
--
-- Expand/contract: both columns are additive with a default. The previous application
-- never reads them and keeps running against this schema; a rollback loses nothing but
-- the plan itself.

ALTER TABLE users
    ADD COLUMN plan VARCHAR(20) NOT NULL DEFAULT 'FREE',
    ADD COLUMN plan_expires_at TIMESTAMP WITH TIME ZONE NULL;

-- Nobody has paid yet, so every existing account is FREE, which the default writes.
