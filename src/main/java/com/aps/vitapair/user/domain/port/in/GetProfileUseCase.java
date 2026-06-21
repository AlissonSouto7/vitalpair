package com.aps.vitapair.user.domain.port.in;

import com.aps.vitapair.user.domain.model.User;
import java.util.UUID;

public interface GetProfileUseCase {

    User getProfile(UUID userId);
}
