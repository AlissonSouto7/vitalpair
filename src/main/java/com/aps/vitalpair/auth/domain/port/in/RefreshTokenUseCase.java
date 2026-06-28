package com.aps.vitalpair.auth.domain.port.in;

import com.aps.vitalpair.auth.application.dto.AuthResult;

public interface RefreshTokenUseCase {

    AuthResult refresh(String refreshToken);
}
