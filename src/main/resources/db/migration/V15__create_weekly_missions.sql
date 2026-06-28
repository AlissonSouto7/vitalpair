-- Catálogo de missões semanais. O progresso é calculado em tempo real
-- a partir dos logs reais (food_logs / activity_logs), não é persistido aqui.
CREATE TABLE weekly_missions (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code          VARCHAR(50)  NOT NULL UNIQUE,
    title         VARCHAR(150) NOT NULL,
    subtitle      VARCHAR(255),
    reward        INT          NOT NULL,
    target        INT          NOT NULL,
    metric        VARCHAR(20)  NOT NULL
                  CHECK (metric IN ('MEAL_DAYS', 'WORKOUTS')),
    scope         VARCHAR(10)  NOT NULL
                  CHECK (scope IN ('SELF', 'PAIR')),
    icon          VARCHAR(20)  NOT NULL
                  CHECK (icon IN ('MEAL', 'WORKOUT', 'USERS')),
    display_order INT          NOT NULL
);

CREATE INDEX idx_weekly_missions_order ON weekly_missions (display_order);

-- Catálogo inicial de missões semanais
INSERT INTO weekly_missions (code, title, subtitle, reward, target, metric, scope, icon, display_order) VALUES
    ('MEAL_DAYS_5',     'Registre refeições em 5 dias',     'Sem pular nenhum dia',              40, 5, 'MEAL_DAYS', 'SELF', 'MEAL',    1),
    ('WORKOUTS_3',      'Treine 3x essa semana',            'Bora suar a camisa',               35, 3, 'WORKOUTS',  'SELF', 'WORKOUT', 2),
    ('PAIR_WORKOUTS_3', 'Treinem 3x essa semana, os dois',  'Só vale se os dois fizerem a parte', 60, 3, 'WORKOUTS',  'PAIR', 'USERS',   3);
