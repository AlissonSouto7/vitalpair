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
import com.aps.vitalpair.auth.domain.port.in.RequestPasswordResetUseCase;
import com.aps.vitalpair.auth.domain.port.in.ResetPasswordUseCase;
import com.aps.vitalpair.auth.domain.port.out.MailSenderPort;
import com.aps.vitalpair.auth.domain.port.out.PasswordHasherPort;
import com.aps.vitalpair.auth.domain.port.out.PasswordResetTokenStorePort;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * Fluxo de redefinição de senha por e-mail. O token é opaco e guardado no Redis com TTL curto;
 * o link aponta para a tela do frontend, que então chama {@code POST /auth/reset-password}.
 */
@Service
public class PasswordResetService implements RequestPasswordResetUseCase, ResetPasswordUseCase {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepositoryPort userRepository;
    private final PasswordHasherPort passwordHasher;
    private final PasswordResetTokenStorePort tokenStore;
    private final MailSenderPort mailSender;
    private final long tokenTtlMs;
    private final String frontendUrl;

    public PasswordResetService(
            UserRepositoryPort userRepository,
            PasswordHasherPort passwordHasher,
            PasswordResetTokenStorePort tokenStore,
            MailSenderPort mailSender,
            @Value("${vitalpair.password-reset.token-ttl-ms:1800000}") long tokenTtlMs,
            @Value("${vitalpair.app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
        this.tokenStore = tokenStore;
        this.mailSender = mailSender;
        this.tokenTtlMs = tokenTtlMs;
        this.frontendUrl = frontendUrl;
    }

    @Override
    @Transactional(readOnly = true)
    public void requestReset(String email) {
        userRepository
                .findByEmail(email)
                .ifPresentOrElse(
                        this::issueResetToken,
                        () -> log.info("Pedido de redefinição para e-mail sem conta (ignorado): {}", email));
    }

    private void issueResetToken(User user) {
        String token = generateOpaqueToken();
        tokenStore.save(token, user.getId(), tokenTtlMs);
        String link = frontendUrl + "/reset-password?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
        mailSender.sendPasswordReset(user.getEmail(), user.getName(), link);
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        UUID userId = tokenStore
                .findUser(token)
                .orElseThrow(() -> new InvalidCredentialsException("Token inválido ou expirado"));
        User user = userRepository
                .findById(userId)
                .orElseThrow(() -> new InvalidCredentialsException("Token inválido ou expirado"));

        userRepository.save(
                user.toBuilder().passwordHash(passwordHasher.hash(newPassword)).build());
        tokenStore.revoke(token);
        log.info("Senha redefinida para o usuário {}", userId);
    }

    private String generateOpaqueToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
