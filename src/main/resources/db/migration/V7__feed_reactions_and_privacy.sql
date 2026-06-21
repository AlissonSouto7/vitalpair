-- Privacidade de refeições e reações no feed - ver §5.5
ALTER TABLE food_logs ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE feed_items ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE feed_reactions (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_item_id UUID        NOT NULL REFERENCES feed_items (id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL REFERENCES users (id),
    type         VARCHAR(20) NOT NULL CHECK (type IN ('FIRE', 'EYE', 'STRENGTH')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (feed_item_id, user_id, type)
);

CREATE INDEX idx_feed_reactions_item ON feed_reactions (feed_item_id);
