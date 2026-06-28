-- Ledger de pontos: cada linha é um award que entrou no placar da competição.
-- Gravado no MESMO ponto onde o placar (competition_scores) é incrementado,
-- para que a soma do ledger na janela bata exatamente com o competition.
CREATE TABLE point_events (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID        NOT NULL REFERENCES pairs (id),
    user_id     UUID        NOT NULL REFERENCES users (id),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    source      VARCHAR(20) NOT NULL
                CHECK (source IN ('MEAL', 'ACTIVITY', 'STREAK', 'MISSION')),
    points      INT         NOT NULL
);

CREATE INDEX idx_point_events_tenant_time ON point_events (tenant_id, occurred_at);
CREATE INDEX idx_point_events_tenant_user ON point_events (tenant_id, user_id);
