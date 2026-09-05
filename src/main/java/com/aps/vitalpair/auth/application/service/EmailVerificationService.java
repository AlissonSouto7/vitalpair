package com.aps.vitalpair.auth.application.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.auth.domain.exception.InvalidCredentialsException;
import com.aps.vitalpair.auth.domain.port.in.ResendEmailVerificationUseCase;
import com.aps.vitalpair.auth.domain.port.in.SendEmailVerificationUseCase;
import com.aps.vitalpair.auth.domain.port.in.VerifyEmailUseCase;
import com.aps.vitalpair.auth.domain.port.out.EmailVerificationTokenStorePort;
import com.aps.vitalpair.auth.domain.port.out.MailSenderPort;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * Confirmação de e-mail. O cadastro segue funcionando (login liberado), mas a conta fica marcada
 * como não verificada até o usuário clicar no link enviado por e-mail. Contas via Google já
 * entram verificadas (o Google confirma o e-mail).
 */
@Service
public class EmailVerificationService
        implements SendEmailVerificationUseCase, VerifyEmailUseCase, ResendEmailVerificationUseCase {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepositoryPort userRepository;
    private final EmailVerificationTokenStorePort tokenStore;
    private final MailSenderPort mailSender;
    private final long tokenTtlMs;
    private final String frontendUrl;

    public EmailVerificationService(
            UserRepositoryPort userRepository,
            EmailVerificationTokenStorePort tokenStore,
            MailSenderPort mailSender,
            @Value("${vitalpair.email-verification.token-ttl-ms:86400000}") long tokenTtlMs,
            @Value("${vitalpair.app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.userRepository = userRepository;
        this.tokenStore = tokenStore;
        this.mailSender = mailSender;
        this.tokenTtlMs = tokenTtlMs;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void send(UUID userId, String email, String name) {
        String token = generateOpaqueToken();
        tokenStore.save(token, userId, tokenTtlMs);
        String link = frontendUrl + "/verify-email?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
        mailSender.sendEmailVerification(email, name, link);
    }

    @Override
    @Transactional
    public void verify(String token) {
        UUID userId = tokenStore
                .findUser(token)
                .orElseThrow(() -> new InvalidCredentialsException("Token inválido ou expirado"));
        User user = userRepository
                .findById(userId)
                .orElseThrow(() -> new InvalidCredentialsException("Token inválido ou expirado"));

        if (!user.isEmailVerified()) {
            userRepository.save(user.toBuilder().emailVerified(true).build());
        }
        tokenStore.revoke(token);
        log.info("E-mail confirmado para o usuário {}", userId);
    }

    @Override
    @Transactional(readOnly = true)
    public void resend(String email) {
        userRepository
                .findByEmail(email)
                .filter(user -> !user.isEmailVerified())
                .ifPresent(user -> send(user.getId(), user.getEmail(), user.getName()));
    }

    private String generateOpaqueToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
