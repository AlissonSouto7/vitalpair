package com.aps.vitalpair.auth.domain.port.in;

import com.aps.vitalpair.auth.application.dto.AuthResult;
import com.aps.vitalpair.auth.application.dto.LoginCommand;

public interface LoginUseCase {

    AuthResult login(LoginCommand command);
}
