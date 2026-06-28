package com.aps.vitalpair.user.domain.port.in;

import com.aps.vitalpair.user.application.dto.UpdateProfileCommand;
import com.aps.vitalpair.user.domain.model.User;
import java.util.UUID;

public interface UpdateProfileUseCase {

    User updateProfile(UUID userId, UpdateProfileCommand command);
}
