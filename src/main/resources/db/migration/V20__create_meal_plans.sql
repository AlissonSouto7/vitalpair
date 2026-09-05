-- Plano alimentar semanal gerado por IA (feature ai). Um plano por usuário por
-- semana (week_start = segunda-feira); gerar de novo substitui o plano inteiro.
CREATE TABLE meal_plans (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users (id),
    week_start DATE        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_meal_plans_user_week UNIQUE (user_id, week_start)
);

-- Refeições do plano: 7 dias (day_index 0 = segunda) x 4 refeições por dia.
CREATE TABLE meal_plan_items (
    id        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id   UUID         NOT NULL REFERENCES meal_plans (id) ON DELETE CASCADE,
    day_index INT          NOT NULL CHECK (day_index BETWEEN 0 AND 6),
    meal_type VARCHAR(20)  NOT NULL CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'SNACK', 'DINNER')),
    name      VARCHAR(255) NOT NULL,
    kcal      INT          NOT NULL,
    protein_g INT          NOT NULL,
    carb_g    INT          NOT NULL,
    fat_g     INT          NOT NULL,
    CONSTRAINT uq_meal_plan_items_slot UNIQUE (plan_id, day_index, meal_type)
);

CREATE INDEX idx_meal_plans_user_week ON meal_plans (user_id, week_start);
CREATE INDEX idx_meal_plan_items_plan ON meal_plan_items (plan_id);
