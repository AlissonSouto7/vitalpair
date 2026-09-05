package com.aps.vitalpair.shared.security;

/**
 * What a user is allowed to do beyond their own data.
 *
 * <p>Deliberately two values. Every user needs USER; operational endpoints need something
 * that is not USER. A finer-grained scheme would be guessing at distinctions the product
 * does not have yet, and adding a third value later is one migration.
 */
public enum Role {

    /** Everyone. Full access to their own data and their pair's, nothing else. */
    USER,

    /**
     * Operational access. Granted by a database update rather than through the API: an
     * endpoint that grants admin is an escalation path, and this product has two users.
     */
    ADMIN
}
