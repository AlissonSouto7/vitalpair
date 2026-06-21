package com.aps.vitapair.user.domain.port.in;

import com.aps.vitapair.user.application.dto.UpdateProfileCommand;
import com.aps.vitapair.user.domain.model.User;
import java.util.UUID;

public interface UpdateProfileUseCase {

    User updateProfile(UUID userId, UpdateProfileCommand command);
}
