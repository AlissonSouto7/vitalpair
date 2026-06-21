-- Catálogo de conquistas e badges conquistados por usuário - ver §4.2 / §5.6
CREATE TABLE badges (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    icon        VARCHAR(50),
    category    VARCHAR(20)  NOT NULL
                CHECK (category IN ('NUTRITION', 'WORKOUT', 'CONSISTENCY', 'SOCIAL', 'WEIGHT'))
);

CREATE TABLE user_badges (
    id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID        NOT NULL REFERENCES pairs (id),
    user_id   UUID        NOT NULL REFERENCES users (id),
    badge_id  UUID        NOT NULL REFERENCES badges (id),
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, badge_id)
);

CREATE INDEX idx_user_badges_tenant ON user_badges (tenant_id);

-- Catálogo inicial
INSERT INTO badges (code, name, description, icon, category) VALUES
    ('FIRST_MEAL', 'Primeira refeição', 'Registrou a primeira refeição', 'fa-utensils', 'NUTRITION'),
    ('FIRST_ACTIVITY', 'Primeira atividade', 'Registrou a primeira atividade física', 'fa-person-running', 'WORKOUT'),
    ('STREAK_7_NUTRITION', '7 dias nutrindo', '7 dias seguidos registrando refeições', 'fa-fire', 'CONSISTENCY'),
    ('STREAK_7_ACTIVITY', '7 dias ativo', '7 dias seguidos de atividade física', 'fa-fire', 'CONSISTENCY'),
    ('PAIR_FORMED', 'Dupla formada', 'Formou um par no VitaPair', 'fa-people-arrows', 'SOCIAL');
