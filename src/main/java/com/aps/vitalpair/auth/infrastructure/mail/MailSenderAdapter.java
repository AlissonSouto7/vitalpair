package com.aps.vitalpair.auth.infrastructure.mail;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import com.aps.vitalpair.auth.domain.port.out.MailSenderPort;

/**
 * Adapter de e-mail. Quando {@code vitalpair.mail.enabled=true} e há um {@link JavaMailSender}
 * configurado (spring.mail.*), envia um e-mail HTML com a marca. Caso contrário (dev), apenas
 * registra o link no log para permitir testar o fluxo sem servidor SMTP.
 */
@Component
public class MailSenderAdapter implements MailSenderPort {

    private static final Logger log = LoggerFactory.getLogger(MailSenderAdapter.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final boolean enabled;
    private final String from;

    public MailSenderAdapter(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${vitalpair.mail.enabled:false}") boolean enabled,
            @Value("${vitalpair.mail.from:VitalPair <no-reply@vitalpair.app>}") String from) {
        this.mailSenderProvider = mailSenderProvider;
        this.enabled = enabled;
        this.from = from;
    }

    @Override
    public void sendPasswordReset(String toEmail, String name, String resetLink) {
        String html = brandedHtml(
                greet(name),
                "Recebemos um pedido pra redefinir a senha da sua conta. É só clicar no botão e criar uma nova.",
                "Criar nova senha",
                resetLink,
                "O link vale por 30 minutos. Se não foi você, pode ignorar este e-mail: sua senha continua a mesma.");
        send(toEmail, "Redefinição de senha do VitalPair", html, "redefinição");
    }

    @Override
    public void sendEmailVerification(String toEmail, String name, String verifyLink) {
        String html = brandedHtml(
                greet(name),
                "Falta só confirmar seu e-mail pra ativar de vez sua conta no VitalPair.",
                "Confirmar e-mail",
                verifyLink,
                "O link vale por 24 horas. Se não foi você que criou a conta, pode ignorar este e-mail.");
        send(toEmail, "Confirme seu e-mail no VitalPair", html, "confirmação");
    }

    private void send(String toEmail, String subject, String html, String kind) {
        JavaMailSender mailSender = enabled ? mailSenderProvider.getIfAvailable() : null;
        if (mailSender == null) {
            // Never log the link: it carries a single-use token that grants account
            // takeover to anyone who can read the log. The masked address is enough to
            // tell which flow ran, and the warning makes a misconfigured MAIL_ENABLED
            // visible in production instead of silently dropping mail.
            log.warn("Mail disabled, {} e-mail for {} was not sent", kind, mask(toEmail));
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("E-mail de {} enviado para {}", kind, toEmail);
        } catch (MessagingException ex) {
            throw new IllegalStateException("Falha ao montar o e-mail de " + kind, ex);
        }
    }

    /** Primeiro nome, ou "por aí" se não tiver nome. */
    private static String greet(String name) {
        if (name == null || name.isBlank()) {
            return "por aí";
        }
        return esc(name.trim().split("\\s+")[0]);
    }

    private static String esc(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    /**
     * Masks an address for logging: {@code person@example.com} becomes {@code p***@example.com}.
     *
     * <p>Enough to tell which account a log line refers to when reading it next to the
     * database, without writing personal data into a file that gets shipped, archived and
     * read by tooling.
     */
    private static String mask(String email) {
        if (email == null || email.isBlank()) {
            return "<none>";
        }
        int at = email.indexOf('@');
        if (at <= 0) {
            return "***";
        }
        return email.charAt(0) + "***" + email.substring(at);
    }

    private String brandedHtml(String greeting, String intro, String ctaLabel, String ctaUrl, String note) {
        return EMAIL_TEMPLATE
                .replace("{{greeting}}", greeting)
                .replace("{{intro}}", intro)
                .replace("{{ctaLabel}}", ctaLabel)
                .replace("{{note}}", note)
                .replace("{{ctaUrl}}", ctaUrl);
    }

    private static final String EMAIL_TEMPLATE =
            """
            <!doctype html>
            <html lang="pt-BR">
              <body style="margin:0;padding:0;background:#fbf6ee;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fbf6ee;">
                  <tr><td align="center" style="padding:32px 14px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #ece1cf;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      <tr><td style="background:#ff6b2c;padding:22px 28px;">
                        <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-.02em;line-height:1;">VitalPair</div>
                        <div style="font-size:10px;font-weight:800;letter-spacing:.08em;color:rgba(255,255,255,.85);text-transform:uppercase;margin-top:4px;">Saúde é melhor em dupla</div>
                      </td></tr>
                      <tr><td style="padding:28px;">
                        <p style="margin:0 0 14px;font-size:17px;font-weight:700;color:#241f17;">Oi, {{greeting}}!</p>
                        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5b5040;">{{intro}}</p>
                        <table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="border-radius:12px;background:#ff6b2c;">
                          <a href="{{ctaUrl}}" target="_blank" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;">{{ctaLabel}}</a>
                        </td></tr></table>
                        <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8a7f6d;">{{note}}</p>
                        <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#a99a85;">Se o botão não abrir, copie e cole no navegador:<br><a href="{{ctaUrl}}" target="_blank" style="color:#e0561c;word-break:break-all;">{{ctaUrl}}</a></p>
                      </td></tr>
                      <tr><td style="padding:16px 28px;border-top:1px solid #ece1cf;">
                        <div style="font-size:12px;color:#a99a85;">VitalPair · Saúde é melhor em dupla</div>
                      </td></tr>
                    </table>
                  </td></tr>
                </table>
              </body>
            </html>""";
}
