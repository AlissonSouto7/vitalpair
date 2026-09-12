package com.aps.vitalpair.auth.infrastructure.mail;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mail.javamail.JavaMailSender;

import com.aps.vitalpair.auth.domain.port.out.MailSenderPort;

/**
 * Guards the log output of the adapter when mail sending is disabled.
 *
 * <p>With {@code MAIL_ENABLED=false}, which is the default in development, this adapter used
 * to log the full reset link. That link contains a single-use token that lets the bearer set
 * a new password for the account, so anyone able to read the logs could take over any user.
 * CodeQL flags it as java/sensitive-log, high severity.
 */
@ExtendWith(OutputCaptureExtension.class)
class MailSenderAdapterTest {

    private static final String TOKEN = "a-very-secret-single-use-token";
    private static final String RESET_LINK = "https://vitalpair.app/reset-password?token=" + TOKEN;
    private static final String EMAIL = "person@example.com";

    /** No JavaMailSender available: the adapter takes its "mail disabled" path. */
    private MailSenderPort adapterWithMailDisabled() {
        return new MailSenderAdapter(new NoMailSenderProvider(), false, "VitalPair <no-reply@vitalpair.app>");
    }

    @Test
    void doesNotLogTheResetTokenWhenMailIsDisabled(CapturedOutput output) {
        adapterWithMailDisabled().sendPasswordReset(EMAIL, "Person", RESET_LINK);

        assertThat(output.getAll())
                .as("the reset token must never reach the log: it grants account takeover")
                .doesNotContain(TOKEN)
                .doesNotContain(RESET_LINK);
    }

    @Test
    void doesNotLogTheVerificationTokenWhenMailIsDisabled(CapturedOutput output) {
        String verifyLink = "https://vitalpair.app/verify-email?token=" + TOKEN;

        adapterWithMailDisabled().sendEmailVerification(EMAIL, "Person", verifyLink);

        assertThat(output.getAll())
                .as("the verification token must never reach the log")
                .doesNotContain(TOKEN)
                .doesNotContain(verifyLink);
    }

    @Test
    void doesNotLogTheFullEmailAddressWhenMailIsDisabled(CapturedOutput output) {
        adapterWithMailDisabled().sendPasswordReset(EMAIL, "Person", RESET_LINK);

        assertThat(output.getAll())
                .as("a full address in the log is personal data with no operational value")
                .doesNotContain(EMAIL);
    }

    /**
     * The sent path logged the full address while the skipped path masked it. Both lines
     * end up in the same shipped, archived log, so both mask.
     */
    @Test
    void doesNotLogTheFullEmailAddressWhenMailIsSent(CapturedOutput output) {
        JavaMailSender sender = mock(JavaMailSender.class);
        when(sender.createMimeMessage()).thenReturn(new MimeMessage((Session) null));
        MailSenderPort adapter =
                new MailSenderAdapter(new FixedMailSenderProvider(sender), true, "VitalPair <no-reply@vitalpair.app>");

        adapter.sendPasswordReset(EMAIL, "Person", RESET_LINK);

        assertThat(output.getAll())
                .as("the sent line must mask the address the same way the skipped line does")
                .doesNotContain(EMAIL)
                .contains("p***@example.com");
    }

    @Test
    void stillReportsThatAnEmailWasSkipped(CapturedOutput output) {
        adapterWithMailDisabled().sendPasswordReset(EMAIL, "Person", RESET_LINK);

        assertThat(output.getAll())
                .as("silence would hide a misconfigured MAIL_ENABLED in production")
                .containsIgnoringCase("mail");
    }

    /** An ObjectProvider that hands out one fixed sender, which is what Spring does when mail is configured. */
    private static final class FixedMailSenderProvider
            implements org.springframework.beans.factory.ObjectProvider<JavaMailSender> {

        private final JavaMailSender sender;

        FixedMailSenderProvider(JavaMailSender sender) {
            this.sender = sender;
        }

        @Override
        public JavaMailSender getObject(Object... args) {
            return sender;
        }

        @Override
        public JavaMailSender getObject() {
            return sender;
        }

        @Override
        public JavaMailSender getIfAvailable() {
            return sender;
        }

        @Override
        public JavaMailSender getIfUnique() {
            return sender;
        }
    }

    /**
     * Minimal ObjectProvider that never yields a sender, which is what Spring does when no
     * spring.mail.* configuration is present.
     */
    private static final class NoMailSenderProvider
            implements org.springframework.beans.factory.ObjectProvider<JavaMailSender> {

        @Override
        public JavaMailSender getObject(Object... args) {
            throw new UnsupportedOperationException();
        }

        @Override
        public JavaMailSender getObject() {
            throw new UnsupportedOperationException();
        }

        @Override
        public JavaMailSender getIfAvailable() {
            return null;
        }

        @Override
        public JavaMailSender getIfUnique() {
            return null;
        }
    }
}
