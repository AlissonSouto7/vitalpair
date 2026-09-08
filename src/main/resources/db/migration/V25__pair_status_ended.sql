-- Um par pode acabar.
--
-- Até aqui a dupla era permanente: joinPair recusa quem já tem parceiro ativo e nada
-- encerrava a parceria. Quem brigou, terminou ou trocou de parceiro de treino ficava com a
-- conta presa. ENDED é o estado em que os dois saíram.
--
-- A linha do par sobrevive porque temporadas, placares semanais e o ledger de pontos
-- apontam para ela, e isso descreve uma competição que aconteceu. O histórico de temporada
-- é somado do ledger a cada leitura, então apagar as linhas não removeria o registro:
-- recalcularia toda temporada passada com o rival zerado e entregaria a vitória a quem
-- perdeu. Os dois membros vão para tenants próprios, então nenhuma query alcança este.
--
-- Expand/contract: só acrescenta um valor aceito. A aplicação anterior continua rodando
-- contra este schema, porque nada que ela escreve deixou de ser válido.

ALTER TABLE pairs
    DROP CONSTRAINT pairs_status_check;

ALTER TABLE pairs
    ADD CONSTRAINT pairs_status_check
        CHECK (status IN ('PENDING', 'ACTIVE', 'PAUSED', 'ENDED'));
