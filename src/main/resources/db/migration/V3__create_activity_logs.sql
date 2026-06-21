-- Registro de atividades físicas (passos, treinos, cardio) - ver §4.2
CREATE TABLE activity_logs (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID         NOT NULL REFERENCES pairs (id),
    user_id          UUID         NOT NULL REFERENCES users (id),
    activity_type    VARCHAR(20)  NOT NULL
                     CHECK (activity_type IN ('STEPS', 'RUN', 'WALK', 'CYCLE', 'WORKOUT', 'OTHER')),
    steps            INT,
    distance_km      NUMERIC(6, 3),
    calories_burned  NUMERIC(7, 2) NOT NULL DEFAULT 0,
    duration_minutes INT,
    source           VARCHAR(20)  NOT NULL
                     CHECK (source IN ('WEWARD', 'GOOGLE_FIT', 'APPLE_HEALTH', 'STRAVA', 'GARMIN', 'MANUAL')),
    external_id      VARCHAR(255),
    logged_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_tenant ON activity_logs (tenant_id);
CREATE INDEX idx_activity_logs_user_logged_at ON activity_logs (user_id, logged_at);
