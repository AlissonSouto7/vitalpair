package com.aps.vitapair.auth.domain.port.in;

import com.aps.vitapair.auth.application.dto.AuthResult;

public interface RefreshTokenUseCase {

    AuthResult refresh(String refreshToken);
}
