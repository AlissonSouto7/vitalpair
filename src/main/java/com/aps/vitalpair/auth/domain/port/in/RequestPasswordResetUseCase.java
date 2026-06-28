package com.aps.vitalpair.auth.domain.port.in;

/** Inicia a redefinição de senha: gera um token e envia o link por e-mail. */
public interface RequestPasswordResetUseCase {

    /**
     * Sempre conclui sem erro mesmo se o e-mail não existir (não revela se há conta com aquele
     * e-mail, evitando enumeração de usuários).
     */
    void requestReset(String email);
}
