package com.aps.vitalpair.auth.domain.port.out;

/** Abstração de hashing de senha (implementada com BCrypt). */
public interface PasswordHasherPort {

    String hash(String rawPassword);

    boolean matches(String rawPassword, String hashedPassword);
}
