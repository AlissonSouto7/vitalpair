-- As medalhas de peso.
--
-- A categoria WEIGHT existia no enum e no CHECK da V6 desde o começo e nenhuma medalha a
-- usava: a tela mostrava a família "Peso" com zero medalhas dentro, para todo mundo.
--
-- MEDIDAS NA DIREÇÃO DO OBJETIVO DE CADA UM, não em quilos perdidos. Este produto é feito
-- para um casal com metas opostas, então "perdeu 3 kg" premiaria uma pessoa e puniria a
-- outra pelo mesmo acerto. A regra vive em WeightMilestone, no domínio, e é a mesma leitura
-- que a tela de progresso já faz para decidir se o número é boa notícia.
--
-- Três degraus em vez de um só porque o primeiro quilo é quando a pessoa acredita que o
-- aplicativo funciona, e o sétimo é quando ela conta para alguém.
--
-- WEIGHT_STEADY é o contrário dos outros três: quem escolheu manter o peso é premiado por
-- não ter se movido (meio quilo de margem para cada lado).
--
-- Os nomes e as descrições ficam em pt-BR aqui, como as cinco medalhas da V6, porque o
-- catálogo é dado do servidor; a tela traduz pelo `code`, que é estável, e cai para este
-- texto quando o idioma não tem a chave.
INSERT INTO badges (code, name, description, icon, category) VALUES
    ('WEIGHT_FIRST_KILO',  'Primeiro quilo',   'Andou 1 kg na direção do teu objetivo',  'fa-scale-balanced', 'WEIGHT'),
    ('WEIGHT_THREE_KILOS', 'Três quilos',      'Andou 3 kg na direção do teu objetivo',  'fa-scale-balanced', 'WEIGHT'),
    ('WEIGHT_SEVEN_KILOS', 'Sete quilos',      'Andou 7 kg na direção do teu objetivo',  'fa-trophy',         'WEIGHT'),
    ('WEIGHT_STEADY',      'Firme no lugar',   'Manteve o peso, que era exatamente o objetivo', 'fa-anchor',  'WEIGHT');
