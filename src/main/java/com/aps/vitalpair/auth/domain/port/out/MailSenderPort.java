package com.aps.vitalpair.auth.domain.port.out;

/** Sends the transactional e-mails of the authentication flows. */
public interface MailSenderPort {

    /** Sends the e-mail carrying the password reset link. */
    void sendPasswordReset(String toEmail, String name, String resetLink);

    /** Sends the e-mail carrying the account confirmation link. */
    void sendEmailVerification(String toEmail, String name, String verifyLink);

    /**
     * Tells the owner of an address that somebody tried to register with it.
     *
     * <p>This is what keeps registration from answering differently for an address that
     * already has an account. The API says the same thing either way, and the difference
     * happens here, in a mailbox only the owner reads.
     *
     * @param signInLink where the owner signs in, if the attempt was theirs
     */
    void sendRegistrationAttemptOnExistingAccount(String toEmail, String name, String signInLink);
}
