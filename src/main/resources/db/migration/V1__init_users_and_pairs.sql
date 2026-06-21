-- Extensão para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- pairs: o "tenant" do sistema (cada par de usuários é um tenant)
-- user1_id é nullable para quebrar o ciclo de FK durante o registro:
-- cria-se o pair, depois o user (com tenant_id = pair.id), depois associa user1.
-- ---------------------------------------------------------------------------
CREATE TABLE pairs (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id    UUID,
    user2_id    UUID,
    pair_name   VARCHAR(100),
    invite_code VARCHAR(20)  NOT NULL UNIQUE,
    status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING', 'ACTIVE', 'PAUSED')),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            UUID         NOT NULL REFERENCES pairs (id),
    email                VARCHAR(255) NOT NULL UNIQUE,
    password_hash        VARCHAR(255),
    name                 VARCHAR(100) NOT NULL,
    birth_date           DATE,
    sex                  VARCHAR(10)  CHECK (sex IN ('MALE', 'FEMALE', 'OTHER')),
    height_cm            NUMERIC(5, 2),
    weight_kg            NUMERIC(5, 2),
    goal                 VARCHAR(20)  CHECK (goal IN ('LOSE_WEIGHT', 'GAIN_MUSCLE', 'MAINTAIN', 'IMPROVE_FITNESS')),
    activity_level       VARCHAR(20)  CHECK (activity_level IN ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE')),
    daily_calorie_target INT,
    protein_target_g     INT,
    carb_target_g        INT,
    fat_target_g         INT,
    avatar_url           VARCHAR(500),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_tenant_id ON users (tenant_id);

-- FKs de pairs -> users (criadas depois que users existe)
ALTER TABLE pairs
    ADD CONSTRAINT fk_pairs_user1 FOREIGN KEY (user1_id) REFERENCES users (id),
    ADD CONSTRAINT fk_pairs_user2 FOREIGN KEY (user2_id) REFERENCES users (id);
