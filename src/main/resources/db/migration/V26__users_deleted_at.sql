-- Encerramento de conta: a linha do usuário vira lápide em vez de sumir.
--
-- Treze chaves estrangeiras apontam para users, todas NO ACTION, então um DELETE seria
-- recusado. Mas não é por isso que a linha fica: fica porque o ledger de pontos, o placar
-- semanal, as temporadas e as medalhas descrevem uma competição entre duas pessoas. O
-- histórico de temporada é somado do ledger a cada leitura, então apagar as linhas de quem
-- saiu recalcularia toda temporada passada com o rival zerado e entregaria a vitória a quem
-- perdeu. A LGPD, art. 12, trata dado anonimizado como não pessoal: a linha continua, sem
-- identificar ninguém.
--
-- deleted_at é o marcador. Sem ele a única pista seria o formato do e-mail higienizado, e
-- "o e-mail parece limpo" não é uma verificação que alguém deva escrever. O refresh de
-- sessão consulta esta coluna, porque o filtro JWT valida só a assinatura e não vai ao
-- banco: sem a coluna, um token emitido antes do encerramento continuaria renovando.
--
-- Expand/contract: coluna nova e anulável, sem default. A aplicação anterior ignora e segue
-- rodando contra este schema.

ALTER TABLE users
    ADD COLUMN deleted_at TIMESTAMPTZ;

-- Só as contas encerradas entram no índice, que é a minoria: o índice parcial não paga
-- pelas linhas vivas, que são a maioria e nunca são filtradas por esta coluna.
CREATE INDEX idx_users_deleted_at ON users (deleted_at) WHERE deleted_at IS NOT NULL;
