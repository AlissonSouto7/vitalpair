-- Registro diário de refeições (ver §4.2 do documento de arquitetura)
CREATE TABLE food_logs (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID         NOT NULL REFERENCES pairs (id),
    user_id       UUID         NOT NULL REFERENCES users (id),
    food_name     VARCHAR(255) NOT NULL,
    barcode       VARCHAR(50),
    quantity_g    NUMERIC(7, 2) NOT NULL,
    calories_kcal NUMERIC(7, 2) NOT NULL,
    protein_g     NUMERIC(6, 2) NOT NULL DEFAULT 0,
    carb_g        NUMERIC(6, 2) NOT NULL DEFAULT 0,
    fat_g         NUMERIC(6, 2) NOT NULL DEFAULT 0,
    meal_type     VARCHAR(20)  NOT NULL
                  CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK')),
    source        VARCHAR(20)  NOT NULL
                  CHECK (source IN ('OPEN_FOOD_FACTS', 'MANUAL')),
    logged_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_food_logs_tenant ON food_logs (tenant_id);
CREATE INDEX idx_food_logs_user_logged_at ON food_logs (user_id, logged_at);
