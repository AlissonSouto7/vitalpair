-- O carrinho: o prato sendo montado, antes de virar refeição registrada.
--
-- Hoje cada alimento vira um registro no instante em que a pessoa confirma, um por vez.
-- Quem almoça arroz, feijão e bife passa três vezes pelo mesmo fluxo, e o diário mostra três
-- linhas de uma refeição só. O carrinho junta o prato e grava tudo de uma vez.
--
-- No servidor, e não no aparelho: o carrinho é dado da pessoa, não estado de tela. Guardá-lo
-- no navegador significaria que montar o prato no celular e terminar no computador perde o
-- que foi montado, e que limpar os dados do site apaga em silêncio o que ela estava fazendo.
-- Uma tabela também é o que permite dizer de quem é cada linha, que é o ponto abaixo.
--
-- ESCOPO: user_id, não tenant_id. Quase tudo neste produto é do par, porque o par é o
-- tenant; o carrinho não é. É o prato de uma pessoa sendo montado, e o par não tem por que
-- ver, muito menos alterar. A coluna de tenant existe mesmo assim, para o isolamento entre
-- pares continuar verificável pela mesma regra que vale no resto do banco, mas toda consulta
-- filtra pelos dois.
--
-- EXPIRAÇÃO: um carrinho abandonado é lixo com data. `expires_at` diz quando ele deixa de
-- valer, e a limpeza é do próprio aplicativo (ver CartCleanupScheduler): sem isso a tabela
-- cresce para sempre com pratos que ninguém confirmou.
CREATE TABLE meal_cart_items (
    id               UUID PRIMARY KEY,
    tenant_id        UUID NOT NULL REFERENCES pairs (id) ON DELETE CASCADE,
    user_id          UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,

    -- Os mesmos campos de food_logs: o item do carrinho é uma refeição que ainda não foi
    -- confirmada, e copiar a forma evita uma tradução no meio do caminho.
    food_name        VARCHAR(255) NOT NULL,
    barcode          VARCHAR(64),
    quantity_g       NUMERIC(8, 2) NOT NULL CHECK (quantity_g > 0),
    calories_kcal    NUMERIC(8, 2) NOT NULL CHECK (calories_kcal >= 0),
    protein_g        NUMERIC(8, 2) NOT NULL CHECK (protein_g >= 0),
    carb_g           NUMERIC(8, 2) NOT NULL CHECK (carb_g >= 0),
    fat_g            NUMERIC(8, 2) NOT NULL CHECK (fat_g >= 0),
    meal_type        VARCHAR(20) NOT NULL CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK')),
    source           VARCHAR(30) NOT NULL CHECK (source IN ('MANUAL', 'OPEN_FOOD_FACTS', 'AI_PHOTO')),
    is_private       BOOLEAN NOT NULL DEFAULT FALSE,

    -- O dia a que o item se refere, na zona da própria pessoa. Guardado como data e não como
    -- instante porque "ontem" é uma pergunta sobre o calendário de quem registra, e quem sabe
    -- responder isso é a aplicação, que conhece o fuso do perfil.
    consumed_on      DATE NOT NULL,

    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at       TIMESTAMP WITH TIME ZONE NOT NULL
);

-- A consulta que a tela faz o tempo todo: o carrinho de uma pessoa, de um dia.
CREATE INDEX idx_meal_cart_owner ON meal_cart_items (user_id, consumed_on);

-- A varredura da limpeza. Sem este índice ela lê a tabela inteira a cada hora.
CREATE INDEX idx_meal_cart_expiry ON meal_cart_items (expires_at);

COMMENT ON TABLE meal_cart_items IS
    'Prato sendo montado antes de virar refeição. De uma pessoa, não do par. Expira.';
