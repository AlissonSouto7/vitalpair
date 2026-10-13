-- Quanto a pessoa quer chegar a pesar.
--
-- O perfil sabia o peso de hoje e o objetivo ("perder peso"), e não sabia quanto. Sem isso o
-- produto não tem como responder a pergunta que a pessoa realmente faz, que é "quanto falta?":
-- o painel mostrava o peso de agora e uma frase pedindo para registrar de novo, mesmo para
-- quem já tinha registrado seis dias seguidos. Havia esforço medido e nenhum progresso
-- mostrado.
--
-- NULO É UM ESTADO LEGÍTIMO, e não um defeito a preencher com palpite. Três casos:
--   1. quem já tem conta e ainda não respondeu;
--   2. quem escolheu "manter o peso" ou "melhorar o condicionamento", onde um peso-alvo não
--      quer dizer nada;
--   3. quem simplesmente não quer dizer.
-- A tela mostra a barra quando existe alvo e oferece defini-lo quando não existe. Inventar
-- um alvo a partir de IMC seria o aplicativo decidir o corpo da pessoa por ela.
--
-- SEM CHECK DE FAIXA aqui além do mínimo físico: a validação de "faz sentido para esta
-- pessoa" (perder peso pede alvo menor que o atual, ganhar massa pede maior) é regra de
-- produto e mora na aplicação, onde pode ter mensagem em português. O banco guarda o limite
-- que nenhuma regra futura vai querer violar.
ALTER TABLE users ADD COLUMN target_weight_kg NUMERIC(5, 2);

ALTER TABLE users ADD CONSTRAINT chk_users_target_weight
    CHECK (target_weight_kg IS NULL OR (target_weight_kg >= 20 AND target_weight_kg <= 500));

COMMENT ON COLUMN users.target_weight_kg IS
    'Peso que a pessoa quer atingir. Nulo quando não respondeu ou quando o objetivo não é de peso.';
