package com.aps.vitalpair.auth.domain.port.in;

public interface LogoutUseCase {

    void logout(String refreshToken);
}
