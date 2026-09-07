package com.aps.vitalpair.auth.domain.port.out;

import com.aps.vitalpair.auth.domain.model.GoogleUserInfo;

/** Verifies a Google id_token and returns the user's data. */
public interface GoogleTokenVerifierPort {

    GoogleUserInfo verify(String idToken);
}
