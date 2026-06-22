-- Notificações in-app, por usuário (tenant_id mantido para isolamento por par).
CREATE TABLE notifications (
    id         UUID PRIMARY KEY,
    tenant_id  UUID         NOT NULL,
    user_id    UUID         NOT NULL,
    type       VARCHAR(30)  NOT NULL,
    title      VARCHAR(120) NOT NULL,
    body       VARCHAR(280) NOT NULL,
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at DESC);
