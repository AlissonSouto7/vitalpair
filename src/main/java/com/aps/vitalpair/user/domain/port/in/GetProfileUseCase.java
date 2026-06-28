package com.aps.vitalpair.user.domain.port.in;

import com.aps.vitalpair.user.domain.model.User;
import java.util.UUID;

public interface GetProfileUseCase {

    User getProfile(UUID userId);
}
