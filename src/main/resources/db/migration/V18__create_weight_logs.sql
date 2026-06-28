-- Histórico de peso do usuário (tela de Progresso). Um registro por dia por
-- usuário; registrar de novo no mesmo dia atualiza o peso (upsert por
-- (user_id, recorded_on)). Alimenta o gráfico de linha de peso.
CREATE TABLE weight_logs (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID          NOT NULL REFERENCES users (id),
    weight_kg   NUMERIC(6, 2) NOT NULL,
    recorded_on DATE          NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_weight_logs_user_day UNIQUE (user_id, recorded_on)
);

CREATE INDEX idx_weight_logs_user_recorded_on ON weight_logs (user_id, recorded_on);
