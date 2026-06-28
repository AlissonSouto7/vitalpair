-- Temporada de 30 dias por par. Lifecycle lazy (sem scheduler): garantido ao
-- consultar GET /api/v1/season. Uma temporada ACTIVE por tenant.
CREATE TABLE seasons (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID         NOT NULL REFERENCES pairs (id),
    number         INT          NOT NULL,
    start_date     DATE         NOT NULL,
    end_date       DATE         NOT NULL,
    stake          VARCHAR(255),
    status         VARCHAR(10)  NOT NULL
                   CHECK (status IN ('ACTIVE', 'CLOSED')),
    winner_user_id UUID,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_seasons_tenant ON seasons (tenant_id);

-- No máximo uma temporada ACTIVE por tenant.
CREATE UNIQUE INDEX uq_seasons_active_per_tenant
    ON seasons (tenant_id) WHERE status = 'ACTIVE';
