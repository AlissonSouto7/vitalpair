package com.aps.vitalpair.pair.domain.model;

import java.security.SecureRandom;

/**
 * The code one person sends the other to form a pair.
 *
 * <p>Lives here rather than in whichever service happened to need it first: registration
 * mints one, and so does leaving a pair. Two copies of the alphabet would eventually drift,
 * and the frontend validates against this exact shape before spending a request.
 */
public final class InviteCode {

    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * No I, O, 0 or 1. The code is read off one screen and typed into another, usually from a
     * photograph of it, and those four are the pairs people get wrong.
     */
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public static final int LENGTH = 8;

    private InviteCode() {}

    public static String generate() {
        StringBuilder sb = new StringBuilder(LENGTH);
        for (int i = 0; i < LENGTH; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}
