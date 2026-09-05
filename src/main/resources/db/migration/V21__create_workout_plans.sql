-- Plano de treino semanal gerado por IA (feature ai). Um plano por usuário por
-- semana (week_start = segunda-feira); gerar de novo substitui o plano inteiro.
CREATE TABLE workout_plans (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users (id),
    week_start DATE        NOT NULL,
    goal       VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_workout_plans_user_week UNIQUE (user_id, week_start)
);

-- Dias do plano: day_index 0 = segunda. rest = dia de descanso (sem exercícios).
-- completed_on registra o dia em que o usuário marcou o treino como feito.
CREATE TABLE workout_days (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id      UUID         NOT NULL REFERENCES workout_plans (id) ON DELETE CASCADE,
    day_index    INT          NOT NULL CHECK (day_index BETWEEN 0 AND 6),
    focus        VARCHAR(100),
    duration_min INT,
    rest         BOOLEAN      NOT NULL DEFAULT FALSE,
    completed_on DATE,
    CONSTRAINT uq_workout_days_plan_day UNIQUE (plan_id, day_index)
);

CREATE TABLE workout_exercises (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id       UUID         NOT NULL REFERENCES workout_days (id) ON DELETE CASCADE,
    position     INT          NOT NULL,
    name         VARCHAR(255) NOT NULL,
    sets         INT          NOT NULL,
    reps         VARCHAR(60)  NOT NULL,
    rest_seconds INT          NOT NULL,
    done         BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_workout_plans_user_week ON workout_plans (user_id, week_start);
CREATE INDEX idx_workout_days_plan ON workout_days (plan_id);
CREATE INDEX idx_workout_exercises_day ON workout_exercises (day_id);
