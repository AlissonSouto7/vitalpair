-- Preferências de notificação por usuário. Linha opcional: se não existir,
-- a aplicação assume os defaults (rival=on, flash=on, reminder=off).
-- Mantida em tabela própria para não inflar o agregado de usuário.
CREATE TABLE notification_preferences (
    user_id         UUID        PRIMARY KEY REFERENCES users (id),
    notify_rival    BOOLEAN     NOT NULL DEFAULT TRUE,
    notify_flash    BOOLEAN     NOT NULL DEFAULT TRUE,
    notify_reminder BOOLEAN     NOT NULL DEFAULT FALSE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
