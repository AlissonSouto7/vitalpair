package com.aps.vitalpair.auth.domain.port.out;

/** Password hashing abstraction (implemented with BCrypt). */
public interface PasswordHasherPort {

    String hash(String rawPassword);

    boolean matches(String rawPassword, String hashedPassword);
}
