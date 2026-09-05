package com.aps.vitalpair.user.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.user.domain.model.User;

public interface GetProfileUseCase {

    User getProfile(UUID userId);
}
