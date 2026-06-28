package com.aps.vitalpair.auth.domain.port.in;

import com.aps.vitalpair.auth.application.dto.AuthResult;
import com.aps.vitalpair.auth.application.dto.RegisterCommand;

public interface RegisterUserUseCase {

    AuthResult register(RegisterCommand command);
}
