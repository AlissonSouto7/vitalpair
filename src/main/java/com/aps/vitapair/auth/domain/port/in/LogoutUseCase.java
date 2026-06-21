package com.aps.vitapair.auth.domain.port.in;

public interface LogoutUseCase {

    void logout(String refreshToken);
}
