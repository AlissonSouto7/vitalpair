-- A recompensa de missão, paga uma vez só.
--
-- O catálogo de missões declara quanto cada uma vale desde que existe (V13 e V15), a tela
-- mostra "+50 pts" em verde, e nenhum código concedia esses pontos: medido em 28/09/2026
-- contra o servidor local, topar a missão de 50 pontos deixava o placar em 25 e a linha
-- "Missões" do resumo da temporada nunca aparecia, porque linhas zeradas dos dois lados são
-- suprimidas. A pessoa cumpria e ganhava nada.
--
-- POR QUE UMA TABELA, e não um campo em pair_missions: a recompensa é de quem cumpriu, e
-- quem cumpre é a pessoa, não o par. Duas pessoas na mesma dupla completam a mesma missão
-- semanal em dias diferentes, e cada uma recebe a sua. `pair_missions` guarda o aceite, que
-- é do par; isto guarda o pagamento, que é individual.
--
-- POR QUE NÃO BASTA O LEDGER: `point_events` é append-only e não tem como dizer "esta linha
-- é da missão MEAL_DAYS_5 da semana de 22/09". Sem essa chave não há como perguntar "já
-- paguei?" antes de pagar de novo, e o progresso das missões semanais é recalculado a cada
-- leitura da tela. Sem a trava, abrir a tela dez vezes pagaria dez vezes.
CREATE TABLE mission_rewards (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES pairs (id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,

    -- O código da missão no catálogo, de qualquer um dos dois tipos. Texto e não FK porque
    -- flash e semanal vivem em tabelas diferentes, e o código é o que ambas expõem ao cliente.
    mission_code VARCHAR(50) NOT NULL,

    -- O período a que a recompensa se refere: a segunda-feira da semana, para a missão
    -- semanal, e o próprio dia, para a relâmpago. É o que separa "cumpri de novo na semana
    -- seguinte" de "abri a tela duas vezes".
    period_start DATE NOT NULL,

    points       INTEGER NOT NULL CHECK (points > 0),
    awarded_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    -- A trava: uma recompensa por pessoa, por missão, por período. É ela que torna a
    -- concessão idempotente por construção, em vez de depender de o serviço lembrar de
    -- checar antes.
    CONSTRAINT uq_mission_reward UNIQUE (user_id, mission_code, period_start)
);

-- A pergunta que a concessão faz antes de pagar: "o que esta pessoa já recebeu neste
-- período?". Uma consulta por leitura de tela, então tem de ser barata.
CREATE INDEX idx_mission_rewards_lookup ON mission_rewards (user_id, period_start);

COMMENT ON TABLE mission_rewards IS
    'Recompensa de missão já paga. A chave única é o que impede pagar duas vezes.';
