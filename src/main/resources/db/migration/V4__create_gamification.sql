-- Streaks (sequências diárias) e placar semanal da competição do par - ver §4.2 / §5.6
CREATE TABLE user_streaks (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          UUID        NOT NULL REFERENCES pairs (id),
    user_id            UUID        NOT NULL REFERENCES users (id),
    type               VARCHAR(20) NOT NULL CHECK (type IN ('NUTRITION_LOG', 'ACTIVITY')),
    current_count      INT         NOT NULL DEFAULT 0,
    longest_count      INT         NOT NULL DEFAULT 0,
    last_activity_date DATE,
    UNIQUE (user_id, type)
);

CREATE INDEX idx_user_streaks_tenant ON user_streaks (tenant_id);

CREATE TABLE competition_scores (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID        NOT NULL REFERENCES pairs (id),
    week_start  DATE        NOT NULL,
    user1_score INT         NOT NULL DEFAULT 0,
    user2_score INT         NOT NULL DEFAULT 0,
    winner_id   UUID        REFERENCES users (id),
    UNIQUE (tenant_id, week_start)
);

CREATE INDEX idx_competition_scores_tenant ON competition_scores (tenant_id);
