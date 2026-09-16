-- The feed used to store a finished Portuguese sentence and a made-up points value, and kept
-- no link to the record it came from. That caused three defects at once:
--
--   * deleting a meal left its feed item behind, because nothing said which item to remove;
--   * the sentence stayed in Portuguese with the interface in English, because it was already
--     persisted, and it used an em dash, which the project's writing rules forbid;
--   * the "+10 pts" badge was a constant stamped on every row, while the points actually
--     awarded go only to the first record of the day, so the badge overstated the score.
--
-- Expand only: the columns are nullable and the old ones stay, so the running version keeps
-- working while this is applied. Dropping title/subtitle is a later contract step.

ALTER TABLE feed_items ADD COLUMN source_id UUID;

-- title held the whole rendered sentence and was NOT NULL because it was the only description
-- there was. New rows describe themselves through the columns below and leave it empty, so the
-- constraint has to go. Existing rows keep their sentence and keep rendering from it.
ALTER TABLE feed_items ALTER COLUMN title DROP NOT NULL;
ALTER TABLE feed_items ADD COLUMN meal_type VARCHAR(20);
ALTER TABLE feed_items ADD COLUMN activity_type VARCHAR(20);
ALTER TABLE feed_items ADD COLUMN food_name VARCHAR(255);
ALTER TABLE feed_items ADD COLUMN calories INTEGER;
ALTER TABLE feed_items ADD COLUMN protein_g INTEGER;
ALTER TABLE feed_items ADD COLUMN carb_g INTEGER;
ALTER TABLE feed_items ADD COLUMN fat_g INTEGER;
ALTER TABLE feed_items ADD COLUMN duration_minutes INTEGER;

-- No foreign key on source_id on purpose: it points at food_logs OR activity_logs depending on
-- the item type, which one column cannot constrain. Deletion is driven by the domain event, not
-- by a cascade, so the pair still sees the item disappear rather than a row vanishing silently.
CREATE INDEX idx_feed_items_source ON feed_items (source_id);

-- Rows written before this migration have no source_id and no structured fields. They keep
-- rendering from `title`/`subtitle`, so nothing disappears from anyone's timeline. Their points
-- badge is the one thing that gets corrected, below.
COMMENT ON COLUMN feed_items.source_id IS
    'The food_logs or activity_logs row this item came from. Null for items written before V29.';

-- The points column claimed a score that was never awarded. The truth lives in point_events,
-- so every existing row is corrected against it. Zero is already the value the screen treats as
-- "show no badge", so a corrected row simply stops advertising points it never earned.
--
-- Points are granted to the first record of the day for that type, so within one user, one day
-- and one type, only the earliest feed item may keep them. Giving every item of that day the
-- ledger's value would turn one 10-point award into a feed claiming 30, which is the defect
-- being fixed rather than a correction of it.
--
-- "The day" is the user's own day, from users.time_zone, and both sides have to be read in it.
-- The two columns are stamped differently: point_events.occurred_at is midnight of the user's
-- day, so 03:00Z for America/Sao_Paulo, while feed_items.created_at is the real instant. A
-- meal logged at 22:41 in Sao Paulo is the 12th in UTC and the 11th locally, so joining on
-- ::date alone paired it with nothing and zeroed a row that had truly earned its points.
-- Measured on a restored copy of the local database: 4 such rows, 40 points, all of them
-- logged between 22:41 and 23:18 local time.
UPDATE feed_items f
SET points = COALESCE(earned.points, 0)
FROM (
    SELECT
        i.id,
        CASE
            WHEN ROW_NUMBER() OVER (
                     PARTITION BY
                         i.user_id,
                         i.tenant_id,
                         i.type,
                         (i.created_at AT TIME ZONE u.time_zone)::date
                     ORDER BY i.created_at
                 ) = 1
            THEN (
                SELECT p.points
                FROM point_events p
                WHERE p.user_id = i.user_id
                  AND p.tenant_id = i.tenant_id
                  AND (p.occurred_at AT TIME ZONE u.time_zone)::date
                      = (i.created_at AT TIME ZONE u.time_zone)::date
                  AND p.source = CASE i.type
                                     WHEN 'MEAL_LOGGED' THEN 'MEAL'
                                     WHEN 'ACTIVITY_LOGGED' THEN 'ACTIVITY'
                                 END
                ORDER BY p.occurred_at
                LIMIT 1
            )
        END AS points
    FROM feed_items i
    JOIN users u ON u.id = i.user_id
) AS earned
WHERE earned.id = f.id
  AND f.points <> COALESCE(earned.points, 0);
