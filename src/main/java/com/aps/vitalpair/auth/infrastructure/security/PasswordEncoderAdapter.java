package com.aps.vitalpair.auth.infrastructure.security;

import com.aps.vitalpair.auth.domain.port.out.PasswordHasherPort;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/** Implementa {@link PasswordHasherPort} com BCrypt (strength 12, conforme §7.1 da arquitetura). */
@Component
public class PasswordEncoderAdapter implements PasswordHasherPort {

    private static final int STRENGTH = 12;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(STRENGTH);

    @Override
    public String hash(String rawPassword) {
        return encoder.encode(rawPassword);
    }

    @Override
    public boolean matches(String rawPassword, String hashedPassword) {
        return encoder.matches(rawPassword, hashedPassword);
    }
}
