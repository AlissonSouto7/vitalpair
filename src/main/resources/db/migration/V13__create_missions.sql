-- Missão relâmpago do dia por par - catálogo + estado diário
CREATE TABLE missions (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code          VARCHAR(50)  NOT NULL UNIQUE,
    title         VARCHAR(100) NOT NULL,
    description   VARCHAR(255),
    reward_points INT          NOT NULL,
    kind          VARCHAR(20)  NOT NULL
                  CHECK (kind IN ('FLASH', 'WEEKLY'))
);

CREATE TABLE pair_missions (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID        NOT NULL REFERENCES pairs (id),
    mission_code VARCHAR(50) NOT NULL,
    mission_date DATE        NOT NULL,
    accepted     BOOLEAN     NOT NULL DEFAULT false,
    accepted_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, mission_date)
);

CREATE INDEX idx_pair_missions_tenant ON pair_missions (tenant_id);

-- Catálogo inicial de missões relâmpago
INSERT INTO missions (code, title, description, reward_points, kind) VALUES
    ('FLASH_WATER',       'Beba 2L de água hoje',       'Hidratação conta ponto', 50, 'FLASH'),
    ('FLASH_THREE_MEALS', 'Registre 3 refeições hoje',  'Não pula refeição',      30, 'FLASH'),
    ('FLASH_WORKOUT',     'Faça um treino hoje',        'Qualquer treino vale',   40, 'FLASH'),
    ('FLASH_STEPS',       'Bata 8.000 passos hoje',     'Bora andar',             35, 'FLASH');
