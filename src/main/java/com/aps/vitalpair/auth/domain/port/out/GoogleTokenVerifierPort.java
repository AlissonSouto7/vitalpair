package com.aps.vitalpair.auth.domain.port.out;

import com.aps.vitalpair.auth.domain.model.GoogleUserInfo;

/** Verifica um id_token do Google e devolve os dados do usuário. */
public interface GoogleTokenVerifierPort {

    GoogleUserInfo verify(String idToken);
}
