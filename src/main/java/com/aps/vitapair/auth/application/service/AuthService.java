package com.aps.vitapair.auth.application.service;

import com.aps.vitapair.auth.application.dto.AuthResult;
import com.aps.vitapair.auth.application.dto.LoginCommand;
import com.aps.vitapair.auth.application.dto.RegisterCommand;
import com.aps.vitapair.auth.domain.exception.InvalidCredentialsException;
import com.aps.vitapair.auth.domain.model.GoogleUserInfo;
import com.aps.vitapair.auth.domain.port.in.GoogleLoginUseCase;
import com.aps.vitapair.auth.domain.port.in.LoginUseCase;
import com.aps.vitapair.auth.domain.port.in.LogoutUseCase;
import com.aps.vitapair.auth.domain.port.in.RefreshTokenUseCase;
import com.aps.vitapair.auth.domain.port.in.RegisterUserUseCase;
import com.aps.vitapair.auth.domain.port.out.GoogleTokenVerifierPort;
import com.aps.vitapair.auth.domain.port.out.PasswordHasherPort;
import com.aps.vitapair.auth.domain.port.out.RefreshTokenStorePort;
import com.aps.vitapair.auth.domain.port.out.TokenProviderPort;
import com.aps.vitapair.config.JwtProperties;
import com.aps.vitapair.pair.domain.model.Pair;
import com.aps.vitapair.pair.domain.model.PairStatus;
import com.aps.vitapair.pair.domain.model.RelationshipType;
import com.aps.vitapair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitapair.shared.exception.BusinessRuleException;
import com.aps.vitapair.user.domain.model.User;
import com.aps.vitapair.user.domain.port.out.UserRepositoryPort;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso de autenticação. No registro, cria-se também o par (tenant) ao qual o usuário pertence,
 * já que cada usuário forma um tenant até convidar o parceiro.
 */
@Service
public class AuthService
        implements RegisterUserUseCase, LoginUseCase, RefreshTokenUseCase, LogoutUseCase, GoogleLoginUseCase {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int INVITE_LENGTH = 8;

    private final UserRepositoryPort userRepository;
    private final PairRepositoryPort pairRepository;
    private final PasswordHasherPort passwordHasher;
    private final TokenProviderPort tokenProvider;
    private final RefreshTokenStorePort refreshTokenStore;
    private final GoogleTokenVerifierPort googleTokenVerifier;
    private final JwtProperties jwtProperties;

    public AuthService(
            UserRepositoryPort userRepository,
            PairRepositoryPort pairRepository,
            PasswordHasherPort passwordHasher,
            TokenProviderPort tokenProvider,
            RefreshTokenStorePort refreshTokenStore,
            GoogleTokenVerifierPort googleTokenVerifier,
            JwtProperties jwtProperties) {
        this.userRepository = userRepository;
        this.pairRepository = pairRepository;
        this.passwordHasher = passwordHasher;
        this.tokenProvider = tokenProvider;
        this.refreshTokenStore = refreshTokenStore;
        this.googleTokenVerifier = googleTokenVerifier;
        this.jwtProperties = jwtProperties;
    }

    @Override
    @Transactional
    public AuthResult register(RegisterCommand command) {
        if (userRepository.existsByEmail(command.email())) {
            throw new BusinessRuleException("E-mail já cadastrado");
        }
        User user = createUserWithTenant(
                command.email(), command.name(), passwordHasher.hash(command.password()));
        return issueTokens(user);
    }

    @Override
    @Transactional
    public AuthResult loginWithGoogle(String idToken) {
        GoogleUserInfo info = googleTokenVerifier.verify(idToken);
        if (info.email() == null || !info.emailVerified()) {
            throw new InvalidCredentialsException("E-mail do Google não verificado");
        }
        User user = userRepository.findByEmail(info.email())
                .orElseGet(() -> createUserWithTenant(
                        info.email(),
                        info.name() != null ? info.name() : info.email(),
                        null));
        return issueTokens(user);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResult login(LoginCommand command) {
        User user = userRepository.findByEmail(command.email())
                .orElseThrow(() -> new InvalidCredentialsException("Credenciais inválidas"));

        if (user.getPasswordHash() == null
                || !passwordHasher.matches(command.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Credenciais inválidas");
        }

        return issueTokens(user);
    }

    @Override
    public AuthResult refresh(String refreshToken) {
        var userId = refreshTokenStore.findUser(refreshToken)
                .orElseThrow(() -> new InvalidCredentialsException("Refresh token inválido ou expirado"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidCredentialsException("Refresh token inválido ou expirado"));

        refreshTokenStore.revoke(refreshToken);
        return issueTokens(user);
    }

    @Override
    public void logout(String refreshToken) {
        refreshTokenStore.revoke(refreshToken);
    }

    private AuthResult issueTokens(User user) {
        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getTenantId(), user.getEmail());
        String refreshToken = generateOpaqueToken();
        refreshTokenStore.save(refreshToken, user.getId(), jwtProperties.refreshExpirationMs());
        return new AuthResult(accessToken, refreshToken, user.getId());
    }

    private User createUserWithTenant(String email, String name, String passwordHash) {
        Pair tenant = pairRepository.save(Pair.builder()
                .inviteCode(generateInviteCode())
                .status(PairStatus.PENDING)
                .relationshipType(RelationshipType.PAIR)
                .build());
        User user = userRepository.save(User.builder()
                .tenantId(tenant.getId())
                .email(email)
                .passwordHash(passwordHash)
                .name(name)
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
