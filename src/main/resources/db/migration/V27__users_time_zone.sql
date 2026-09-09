-- O "dia" do app passa a ser o dia do usuário, não o do servidor.
--
-- Antes, quem responde "quais refeições foram hoje?" chamava LocalDate.now() sem fuso, ou
-- seja, o fuso da JVM, e o adaptador convertia essa data numa janela fixa em UTC. As duas
-- pontas discordavam sempre que os dois fusos não coincidiam. Medido em UTC-3: às 21:35
-- locais (00:35 UTC) o controller dizia "hoje é dia 8" e o adaptador procurava de
-- 08T00:00Z a 09T00:00Z, enquanto a refeição era gravada em 09T00:35Z. A refeição salvava
-- com 201 e sumia da lista do dia na mesma hora, todo dia, das 21:00 à meia-noite.
--
-- Em produção a JVM roda em UTC e as duas pontas voltam a concordar, então o sintoma some
-- e o erro troca de forma: o "dia" vira o dia UTC e o brasileiro que janta às 21:00 tem a
-- refeição contada no dia seguinte. O prato continua no lugar errado e ninguém vê.
--
-- A coluna guarda um identificador da IANA ("America/Sao_Paulo"), não um deslocamento:
-- deslocamento não sabe horário de verão, e o Brasil já teve e pode voltar a ter.
-- Validação fica na aplicação, com ZoneId.of, porque o Postgres não valida o nome e uma
-- CHECK contra pg_timezone_names congelaria a tabela do banco dentro do schema.
--
-- Expand/contract: coluna nova, anulável, com DEFAULT. A aplicação anterior ignora a
-- coluna e continua rodando contra este schema, e um rollback não perde nada além da
-- preferência.

ALTER TABLE users
    ADD COLUMN time_zone VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo';

-- O DEFAULT preenche as linhas existentes, e o valor é o certo para elas: hoje todo mundo
-- que usa o app está no Brasil. Ele fica na coluna para que uma conta criada por um caminho
-- que ainda não conheça a preferência não nasça sem fuso.
