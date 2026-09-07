package com.aps.vitalpair.auth.domain.port.in;

/** Completes the reset: validates the token and stores the new password. */
public interface ResetPasswordUseCase {

    void resetPassword(String token, String newPassword);
}
