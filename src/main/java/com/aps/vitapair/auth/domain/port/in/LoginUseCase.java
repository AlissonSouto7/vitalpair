package com.aps.vitapair.auth.domain.port.in;

import com.aps.vitapair.auth.application.dto.AuthResult;
import com.aps.vitapair.auth.application.dto.LoginCommand;

public interface LoginUseCase {

    AuthResult login(LoginCommand command);
}
