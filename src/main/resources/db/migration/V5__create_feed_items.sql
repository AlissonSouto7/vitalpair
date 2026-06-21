-- Feed compartilhado do par (timeline das ações dos dois) - ver §5.5
CREATE TABLE feed_items (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID         NOT NULL REFERENCES pairs (id),
    user_id    UUID         NOT NULL REFERENCES users (id),
    actor_name VARCHAR(100) NOT NULL,
    type       VARCHAR(30)  NOT NULL
               CHECK (type IN ('MEAL_LOGGED', 'ACTIVITY_LOGGED')),
    title      VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_feed_items_tenant_created ON feed_items (tenant_id, created_at DESC);
