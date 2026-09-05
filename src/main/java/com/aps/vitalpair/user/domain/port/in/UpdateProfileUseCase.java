package com.aps.vitalpair.user.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.user.application.dto.UpdateProfileCommand;
import com.aps.vitalpair.user.domain.model.User;

public interface UpdateProfileUseCase {

    User updateProfile(UUID userId, UpdateProfileCommand command);
}
