-- A aparência do mascote, escolhida pela pessoa.
--
-- O Broto era desenhado com cílios ou com sobrancelhas grossas conforme o PAPEL no par:
-- `who === 'partner' ? 'f' : 'm'`, no componente. Quem entrava como "você" recebia o rosto
-- masculino, sempre, e não havia como trocar. A primeira usuária do app marcou sexo
-- feminino, viu o mascote masculino e perguntou como se muda; a resposta era "não dá".
--
-- Guardar a escolha, em vez de derivar do sexo, é deliberado: o mascote é um bicho de
-- estimação, não um retrato. Quem marcou OUTRO também escolhe, e quem quiser um mascote
-- que não se pareça consigo também.
--
-- Nulo quer dizer "ainda não escolheu", e a aplicação decide o padrão. Sem DEFAULT no banco
-- por isso: um valor gravado aqui seria indistinguível de uma escolha real.
ALTER TABLE users ADD COLUMN mascot VARCHAR(16);

ALTER TABLE users ADD CONSTRAINT users_mascot_valid
    CHECK (mascot IS NULL OR mascot IN ('SPROUT', 'BLOSSOM'));

COMMENT ON COLUMN users.mascot IS
    'Aparência do mascote escolhida pela pessoa. NULL = ainda não escolheu.';
