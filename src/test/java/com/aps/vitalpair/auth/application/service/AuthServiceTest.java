package com.aps.vitalpair.auth.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.aps.vitalpair.auth.application.dto.AuthResult;
import com.aps.vitalpair.auth.application.dto.LoginCommand;
import com.aps.vitalpair.auth.application.dto.RegisterCommand;
import com.aps.vitalpair.auth.domain.exception.InvalidCredentialsException;
import com.aps.vitalpair.auth.domain.model.GoogleUserInfo;
import com.aps.vitalpair.auth.domain.port.in.SendEmailVerificationUseCase;
import com.aps.vitalpair.auth.domain.port.out.GoogleTokenVerifierPort;
import com.aps.vitalpair.auth.domain.port.out.PasswordHasherPort;
import com.aps.vitalpair.auth.domain.port.out.RefreshTokenStorePort;
import com.aps.vitalpair.auth.domain.port.out.TokenProviderPort;
import com.aps.vitalpair.config.JwtProperties;
import com.aps.vitalpair.pair.domain.model.Pair;
import com.aps.vitalpair.pair.domain.model.PairStatus;
import com.aps.vitalpair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitalpair.shared.exception.BusinessRuleException;
import com.aps.vitalpair.shared.security.Role;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final long REFRESH_TTL = 2_592_000_000L;
    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID USER_ID = UUID.randomUUID();

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private PairRepositoryPort pairRepository;

    @Mock
    private PasswordHasherPort passwordHasher;

    @Mock
    private TokenProviderPort tokenProvider;

    @Mock
    private RefreshTokenStorePort refreshTokenStore;

    @Mock
    private GoogleTokenVerifierPort googleTokenVerifier;

    @Mock
    private SendEmailVerificationUseCase sendEmailVerification;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        JwtProperties jwtProperties = new JwtProperties("secret-com-mais-de-32-caracteres-1234", 900_000L, REFRESH_TTL);
        authService = new AuthService(
                userRepository,
                pairRepository,
                passwordHasher,
                tokenProvider,
                refreshTokenStore,
                googleTokenVerifier,
                sendEmailVerification,
                jwtProperties);
    }

    @Test
    void registerCriaTenantUsuarioEEmiteTokens() {
        when(userRepository.existsByEmail("ana@vitalpair.app")).thenReturn(false);
        when(pairRepository.save(any())).thenReturn(pairWithId());
        when(passwordHasher.hash("senha1234")).thenReturn("hashed");
        when(userRepository.save(any())).thenReturn(userWithId());
        when(tokenProvider.generateAccessToken(USER_ID, TENANT_ID, "ana@vitalpair.app", Role.USER))
                .thenReturn("access");

        AuthResult result = authService.register(new RegisterCommand("ana@vitalpair.app", "senha1234", "Ana"));

        assertThat(result.accessToken()).isEqualTo("access");
        assertThat(result.refreshToken()).isNotBlank();
        assertThat(result.userId()).isEqualTo(USER_ID);
        // pair salvo duas vezes: criação + associação do user1
        verify(pairRepository, times(2)).save(any());
        verify(refreshTokenStore).save(anyString(), eq(USER_ID), any(UUID.class), eq(REFRESH_TTL));
    }

    @Test
    void registerSucceedsWhenTheVerificationEmailCannotBeSent() {
        when(userRepository.existsByEmail("ana@vitalpair.app")).thenReturn(false);
        when(pairRepository.save(any())).thenReturn(pairWithId());
        when(passwordHasher.hash("senha1234")).thenReturn("hashed");
        when(userRepository.save(any())).thenReturn(userWithId());
        when(tokenProvider.generateAccessToken(USER_ID, TENANT_ID, "ana@vitalpair.app", Role.USER))
                .thenReturn("access");
        doThrow(new RuntimeException("SMTP unreachable"))
                .when(sendEmailVerification)
                .send(any(), anyString(), anyString());

        AuthResult result = authService.register(new RegisterCommand("ana@vitalpair.app", "senha1234", "Ana"));

        // The account exists and the user is logged in. A mail outage must not cost a
        // signup: the verification e-mail can be resent, but a 500 sends the person away
        // and leaves a half-created account behind.
        assertThat(result.accessToken()).isEqualTo("access");
        assertThat(result.userId()).isEqualTo(USER_ID);
    }

    @Test
    void registerFalhaQuandoEmailJaExiste() {
        when(userRepository.existsByEmail("ana@vitalpair.app")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(new RegisterCommand("ana@vitalpair.app", "senha1234", "Ana")))
                .isInstanceOf(BusinessRuleException.class);

        verify(userRepository, never()).save(any());
        verify(pairRepository, never()).save(any());
    }

    @Test
    void loginComCredenciaisValidasEmiteTokens() {
        when(userRepository.findByEmail("ana@vitalpair.app")).thenReturn(Optional.of(userWithId()));
        when(passwordHasher.matches("senha1234", "hashed")).thenReturn(true);
        when(tokenProvider.generateAccessToken(USER_ID, TENANT_ID, "ana@vitalpair.app", Role.USER))
                .thenReturn("access");

        AuthResult result = authService.login(new LoginCommand("ana@vitalpair.app", "senha1234"));

        assertThat(result.accessToken()).isEqualTo("access");
        verify(refreshTokenStore).save(anyString(), eq(USER_ID), any(UUID.class), eq(REFRESH_TTL));
    }

    @Test
    void loginFalhaComSenhaIncorreta() {
        when(userRepository.findByEmail("ana@vitalpair.app")).thenReturn(Optional.of(userWithId()));
        when(passwordHasher.matches("errada", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginCommand("ana@vitalpair.app", "errada")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void loginFalhaQuandoUsuarioNaoExiste() {
        when(userRepository.findByEmail("ninguem@vitalpair.app")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginCommand("ninguem@vitalpair.app", "x")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void refreshRotacionaTokenEReemite() {
        UUID familyId = UUID.randomUUID();
        when(refreshTokenStore.find("old-refresh"))
                .thenReturn(Optional.of(new RefreshTokenStorePort.StoredRefreshToken(USER_ID, familyId)));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(userWithId()));
        when(tokenProvider.generateAccessToken(USER_ID, TENANT_ID, "ana@vitalpair.app", Role.USER))
                .thenReturn("access");

        AuthResult result = authService.refresh("old-refresh");

        assertThat(result.refreshToken()).isNotEqualTo("old-refresh");
        verify(refreshTokenStore).markSpent(eq("old-refresh"), eq(familyId), anyLong());
        // The replacement stays in the same family, otherwise a later replay of the old
        // token would have nothing to revoke.
        verify(refreshTokenStore).save(anyString(), eq(USER_ID), eq(familyId), anyLong());
    }

    @Test
    void refreshRevokesTheWholeFamilyWhenASpentTokenIsReplayed() {
        UUID familyId = UUID.randomUUID();
        when(refreshTokenStore.find("stolen")).thenReturn(Optional.empty());
        when(refreshTokenStore.findSpentFamily("stolen")).thenReturn(Optional.of(familyId));

        assertThatThrownBy(() -> authService.refresh("stolen")).isInstanceOf(InvalidCredentialsException.class);

        // A refresh token is single-use. A spent one coming back means either theft or a
        // client bug, and there is no way to tell from here, so both sessions end.
        verify(refreshTokenStore).revokeFamily(familyId);
    }

    @Test
    void refreshRevokesNothingForATokenThatWasNeverIssued() {
        when(refreshTokenStore.find("garbage")).thenReturn(Optional.empty());
        when(refreshTokenStore.findSpentFamily("garbage")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refresh("garbage")).isInstanceOf(InvalidCredentialsException.class);

        // Random strings must not be able to trigger a revocation: that would be a way to
        // log other people out by guessing.
        verify(refreshTokenStore, never()).revokeFamily(any());
    }

    @Test
    void logoutRevokesTheWholeFamily() {
        UUID familyId = UUID.randomUUID();
        when(refreshTokenStore.find("current"))
                .thenReturn(Optional.of(new RefreshTokenStorePort.StoredRefreshToken(USER_ID, familyId)));

        authService.logout("current");

        verify(refreshTokenStore).revokeFamily(familyId);
    }

    @Test
    void refreshFalhaComTokenInvalido() {
        when(refreshTokenStore.find("invalid")).thenReturn(Optional.empty());
        when(refreshTokenStore.findSpentFamily("invalid")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refresh("invalid")).isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void googleLoginCriaUsuarioQuandoNaoExiste() {
        when(googleTokenVerifier.verify("google-id-token"))
                .thenReturn(new GoogleUserInfo("bob@gmail.com", "Bob", true));
        when(userRepository.findByEmail("bob@gmail.com")).thenReturn(Optional.empty());
        when(pairRepository.save(any())).thenReturn(pairWithId());
        when(userRepository.save(any()))
                .thenReturn(User.builder()
                        .id(USER_ID)
                        .tenantId(TENANT_ID)
                        .email("bob@gmail.com")
                        .name("Bob")
                        .build());
        when(tokenProvider.generateAccessToken(any(), any(), anyString(), any()))
                .thenReturn("access");

        AuthResult result = authService.loginWithGoogle("google-id-token");

        assertThat(result.accessToken()).isEqualTo("access");
        verify(pairRepository, times(2)).save(any());
        verify(refreshTokenStore).save(anyString(), eq(USER_ID), any(UUID.class), eq(REFRESH_TTL));
    }

    @Test
    void googleLoginUsaUsuarioExistenteSemCriarTenant() {
        when(googleTokenVerifier.verify("google-id-token"))
                .thenReturn(new GoogleUserInfo("ana@vitalpair.app", "Ana", true));
        when(userRepository.findByEmail("ana@vitalpair.app")).thenReturn(Optional.of(userWithId()));
        when(tokenProvider.generateAccessToken(USER_ID, TENANT_ID, "ana@vitalpair.app", Role.USER))
                .thenReturn("access");

        AuthResult result = authService.loginWithGoogle("google-id-token");

        assertThat(result.accessToken()).isEqualTo("access");
        verify(pairRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void googleLoginFalhaQuandoEmailNaoVerificado() {
        when(googleTokenVerifier.verify("google-id-token"))
                .thenReturn(new GoogleUserInfo("bob@gmail.com", "Bob", false));

        assertThatThrownBy(() -> authService.loginWithGoogle("google-id-token"))
                .isInstanceOf(InvalidCredentialsException.class);

        verify(userRepository, never()).save(any());
    }

    private Pair pairWithId() {
        return Pair.builder()
                .id(TENANT_ID)
                .inviteCode("ABCD2345")
                .status(PairStatus.PENDING)
                .build();
    }

    private User userWithId() {
        return User.builder()
                .id(USER_ID)
                .tenantId(TENANT_ID)
                .email("ana@vitalpair.app")
                .passwordHash("hashed")
                .name("Ana")
                .role(Role.USER)
                .build();
    }
}
