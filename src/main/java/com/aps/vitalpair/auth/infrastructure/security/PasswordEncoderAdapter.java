package com.aps.vitalpair.auth.infrastructure.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import com.aps.vitalpair.auth.domain.port.out.PasswordHasherPort;

/**
 * BCrypt behind {@link PasswordHasherPort}, at strength 12.
 *
 * <p>Twelve rather than Spring's default of ten, as agreed in section 7.1 of the architecture
 * document: each step doubles the work, so the two extra steps cost one login four times as
 * much and cost the same to anyone working through a stolen dump.
 */
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
