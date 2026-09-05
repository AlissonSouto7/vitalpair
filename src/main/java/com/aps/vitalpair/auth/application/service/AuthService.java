package com.aps.vitalpair.auth.application.service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.auth.application.dto.AuthResult;
import com.aps.vitalpair.auth.application.dto.LoginCommand;
import com.aps.vitalpair.auth.application.dto.RegisterCommand;
import com.aps.vitalpair.auth.domain.exception.InvalidCredentialsException;
import com.aps.vitalpair.auth.domain.model.GoogleUserInfo;
import com.aps.vitalpair.auth.domain.port.in.GoogleLoginUseCase;
import com.aps.vitalpair.auth.domain.port.in.LoginUseCase;
import com.aps.vitalpair.auth.domain.port.in.LogoutUseCase;
import com.aps.vitalpair.auth.domain.port.in.RefreshTokenUseCase;
import com.aps.vitalpair.auth.domain.port.in.RegisterUserUseCase;
import com.aps.vitalpair.auth.domain.port.in.SendEmailVerificationUseCase;
import com.aps.vitalpair.auth.domain.port.out.GoogleTokenVerifierPort;
import com.aps.vitalpair.auth.domain.port.out.PasswordHasherPort;
import com.aps.vitalpair.auth.domain.port.out.RefreshTokenStorePort;
import com.aps.vitalpair.auth.domain.port.out.TokenProviderPort;
import com.aps.vitalpair.config.JwtProperties;
import com.aps.vitalpair.pair.domain.model.Pair;
import com.aps.vitalpair.pair.domain.model.PairStatus;
import com.aps.vitalpair.pair.domain.model.RelationshipType;
import com.aps.vitalpair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitalpair.shared.exception.BusinessRuleException;
import com.aps.vitalpair.shared.security.Role;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * Casos de uso de autenticação. No registro, cria-se também o par (tenant) ao qual o usuário pertence,
 * já que cada usuário forma um tenant até convidar o parceiro.
 */
@Service
public class AuthService
        implements RegisterUserUseCase, LoginUseCase, RefreshTokenUseCase, LogoutUseCase, GoogleLoginUseCase {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int INVITE_LENGTH = 8;

    private final UserRepositoryPort userRepository;
    private final PairRepositoryPort pairRepository;
    private final PasswordHasherPort passwordHasher;
    private final TokenProviderPort tokenProvider;
    private final RefreshTokenStorePort refreshTokenStore;
    private final GoogleTokenVerifierPort googleTokenVerifier;
    private final SendEmailVerificationUseCase sendEmailVerification;
    private final JwtProperties jwtProperties;

    public AuthService(
            UserRepositoryPort userRepository,
            PairRepositoryPort pairRepository,
            PasswordHasherPort passwordHasher,
            TokenProviderPort tokenProvider,
            RefreshTokenStorePort refreshTokenStore,
            GoogleTokenVerifierPort googleTokenVerifier,
            SendEmailVerificationUseCase sendEmailVerification,
            JwtProperties jwtProperties) {
        this.userRepository = userRepository;
        this.pairRepository = pairRepository;
        this.passwordHasher = passwordHasher;
        this.tokenProvider = tokenProvider;
        this.refreshTokenStore = refreshTokenStore;
        this.googleTokenVerifier = googleTokenVerifier;
        this.sendEmailVerification = sendEmailVerification;
        this.jwtProperties = jwtProperties;
    }

    @Override
    @Transactional
    public AuthResult register(RegisterCommand command) {
        if (userRepository.existsByEmail(command.email())) {
            throw new BusinessRuleException("E-mail já cadastrado");
        }
        User user =
                createUserWithTenant(command.email(), command.name(), passwordHasher.hash(command.password()), false);
        // A mail outage must not cost a signup. The account is already created and the
        // person is about to be logged in; the verification e-mail can be resent from the
        // app. Letting the exception through would return 500 to someone whose account
        // does exist, and they would try to register again and hit "e-mail already taken".
        try {
            sendEmailVerification.send(user.getId(), user.getEmail(), user.getName());
        } catch (RuntimeException ex) {
            log.error("Registration succeeded but the verification e-mail failed for user {}", user.getId(), ex);
        }
        return issueTokens(user);
    }

    @Override
    @Transactional
    public AuthResult loginWithGoogle(String idToken) {
        GoogleUserInfo info = googleTokenVerifier.verify(idToken);
        if (info.email() == null || !info.emailVerified()) {
            throw new InvalidCredentialsException("E-mail do Google não verificado");
        }
        User user = userRepository
                .findByEmail(info.email())
                .orElseGet(() -> createUserWithTenant(
                        info.email(), info.name() != null ? info.name() : info.email(), null, true));
        return issueTokens(user);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResult login(LoginCommand command) {
        User user = userRepository
                .findByEmail(command.email())
                .orElseThrow(() -> new InvalidCredentialsException("Credenciais inválidas"));

        if (user.getPasswordHash() == null || !passwordHasher.matches(command.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Credenciais inválidas");
        }

        return issueTokens(user);
    }

    @Override
    public AuthResult refresh(String refreshToken) {
        var stored = refreshTokenStore.find(refreshToken);

        if (stored.isEmpty()) {
            // Not active. If it was spent, someone is replaying a token that was already
            // exchanged. A refresh token is single-use, so the only ways this happens are
            // theft or a client bug, and there is no way to tell them apart from here.
            // Revoking the whole family logs out both the attacker and the legitimate
            // holder, which is the right trade: one forced login beats a silent intruder
            // who can keep renewing for thirty days.
            refreshTokenStore.findSpentFamily(refreshToken).ifPresent(familyId -> {
                log.warn("Refresh token replay detected; revoking token family {}", familyId);
                refreshTokenStore.revokeFamily(familyId);
            });
            throw new InvalidCredentialsException("Refresh token inválido ou expirado");
        }

        User user = userRepository
                .findById(stored.get().userId())
                .orElseThrow(() -> new InvalidCredentialsException("Refresh token inválido ou expirado"));

        refreshTokenStore.markSpent(refreshToken, stored.get().familyId(), jwtProperties.refreshExpirationMs());
        return issueTokens(user, stored.get().familyId());
    }

    @Override
    public void logout(String refreshToken) {
        // Revokes the whole family, not just this token. Logging out should end the session,
        // and after a rotation the family holds the spent predecessors of the current token
        // as well; leaving those behind would keep a stolen one usable.
        refreshTokenStore.find(refreshToken).ifPresent(stored -> refreshTokenStore.revokeFamily(stored.familyId()));
    }

    /** Starts a new token family. Every login and every social sign-in begins one. */
    private AuthResult issueTokens(User user) {
        return issueTokens(user, UUID.randomUUID());
    }

    /**
     * Issues an access and refresh token pair.
     *
     * <p>A rotation passes the family of the token being replaced, so the chain of tokens
     * descended from one login stays linked and can be revoked together.
     */
    private AuthResult issueTokens(User user, UUID familyId) {
        String accessToken =
                tokenProvider.generateAccessToken(user.getId(), user.getTenantId(), user.getEmail(), user.getRole());
        String refreshToken = generateOpaqueToken();
        refreshTokenStore.save(refreshToken, user.getId(), familyId, jwtProperties.refreshExpirationMs());
        return new AuthResult(accessToken, refreshToken, user.getId());
    }

    private User createUserWithTenant(String email, String name, String passwordHash, boolean emailVerified) {
        Pair tenant = pairRepository.save(Pair.builder()
                .inviteCode(generateInviteCode())
                .status(PairStatus.PENDING)
                .relationshipType(RelationshipType.PAIR)
                .build());
        User user = userRepository.save(User.builder()
                .tenantId(tenant.getId())
                .email(email)
                .passwordHash(passwordHash)
                .emailVerified(emailVerified)
                .name(name)
                // Everyone signs up as a plain user. ADMIN is granted by a database update,
                // never through a request, so registration cannot be an escalation path.
                .role(Role.USER)
                .build());
        pairRepository.save(tenant.toBuilder().user1Id(user.getId()).build());
        return user;
    }

    private String generateInviteCode() {
        StringBuilder sb = new StringBuilder(INVITE_LENGTH);
        for (int i = 0; i < INVITE_LENGTH; i++) {
            sb.append(INVITE_ALPHABET.charAt(RANDOM.nextInt(INVITE_ALPHABET.length())));
        }
        return sb.toString();
    }

    private String generateOpaqueToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
