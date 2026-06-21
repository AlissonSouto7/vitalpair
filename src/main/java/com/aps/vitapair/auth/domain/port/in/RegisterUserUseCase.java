package com.aps.vitapair.auth.domain.port.in;

import com.aps.vitapair.auth.application.dto.AuthResult;
import com.aps.vitapair.auth.application.dto.RegisterCommand;

public interface RegisterUserUseCase {

    AuthResult register(RegisterCommand command);
}
