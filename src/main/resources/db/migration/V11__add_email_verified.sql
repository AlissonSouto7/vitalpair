-- Verificação de e-mail: marca se o usuário confirmou o endereço.
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;

-- Contas criadas antes desta feature ficam como verificadas para não travar o acesso.
UPDATE users SET email_verified = true;
