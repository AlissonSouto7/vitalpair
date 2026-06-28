package com.aps.vitalpair.auth.domain.port.out;

/** Envio de e-mails transacionais do fluxo de autenticação. */
public interface MailSenderPort {

    /** Envia o e-mail com o link de redefinição de senha. */
    void sendPasswordReset(String toEmail, String name, String resetLink);

    /** Envia o e-mail com o link de confirmação de conta. */
    void sendEmailVerification(String toEmail, String name, String verifyLink);
}
