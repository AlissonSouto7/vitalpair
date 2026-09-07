package com.aps.vitalpair.auth.domain.port.out;

/** Sends the transactional e-mails of the authentication flows. */
public interface MailSenderPort {

    /** Sends the e-mail carrying the password reset link. */
    void sendPasswordReset(String toEmail, String name, String resetLink);

    /** Sends the e-mail carrying the account confirmation link. */
    void sendEmailVerification(String toEmail, String name, String verifyLink);
}
