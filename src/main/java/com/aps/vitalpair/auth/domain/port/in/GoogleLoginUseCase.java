package com.aps.vitalpair.auth.domain.port.in;

import com.aps.vitalpair.auth.application.dto.AuthResult;

public interface GoogleLoginUseCase {

    AuthResult loginWithGoogle(String idToken);
}
