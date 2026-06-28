package com.aps.vitalpair.auth.domain.port.in;

/** Conclui a redefinição: valida o token e grava a nova senha. */
public interface ResetPasswordUseCase {

    void resetPassword(String token, String newPassword);
}
