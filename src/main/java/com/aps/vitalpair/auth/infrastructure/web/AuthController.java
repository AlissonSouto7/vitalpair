package com.aps.vitalpair.auth.infrastructure.web;

import jakarta.validation.Valid;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.auth.application.dto.AuthResult;
import com.aps.vitalpair.auth.application.dto.LoginCommand;
import com.aps.vitalpair.auth.application.dto.RegisterCommand;
import com.aps.vitalpair.auth.domain.exception.InvalidCredentialsException;
import com.aps.vitalpair.auth.domain.port.in.GoogleLoginUseCase;
import com.aps.vitalpair.auth.domain.port.in.LoginUseCase;
import com.aps.vitalpair.auth.domain.port.in.LogoutUseCase;
import com.aps.vitalpair.auth.domain.port.in.RefreshTokenUseCase;
import com.aps.vitalpair.auth.domain.port.in.RegisterUserUseCase;
import com.aps.vitalpair.auth.domain.port.in.RequestPasswordResetUseCase;
import com.aps.vitalpair.auth.domain.port.in.ResendEmailVerificationUseCase;
import com.aps.vitalpair.auth.domain.port.in.ResetPasswordUseCase;
import com.aps.vitalpair.auth.domain.port.in.VerifyEmailUseCase;
import com.aps.vitalpair.shared.web.ApiResponse;
import com.aps.vitalpair.shared.web.StandardApiResponses;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(
        name = "Authentication",
        description =
                "Registering, signing in, renewing a session, and the e-mail flows for verification and password reset.")
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final RegisterUserUseCase registerUserUseCase;
    private final LoginUseCase loginUseCase;
    private final RefreshTokenUseCase refreshTokenUseCase;
    private final LogoutUseCase logoutUseCase;
    private final GoogleLoginUseCase googleLoginUseCase;
    private final RequestPasswordResetUseCase requestPasswordResetUseCase;
    private final ResetPasswordUseCase resetPasswordUseCase;
    private final VerifyEmailUseCase verifyEmailUseCase;
    private final ResendEmailVerificationUseCase resendEmailVerificationUseCase;
    private final RefreshTokenCookie refreshTokenCookie;

    public AuthController(
            RegisterUserUseCase registerUserUseCase,
            LoginUseCase loginUseCase,
            RefreshTokenUseCase refreshTokenUseCase,
            LogoutUseCase logoutUseCase,
            GoogleLoginUseCase googleLoginUseCase,
            RequestPasswordResetUseCase requestPasswordResetUseCase,
            ResetPasswordUseCase resetPasswordUseCase,
            VerifyEmailUseCase verifyEmailUseCase,
            ResendEmailVerificationUseCase resendEmailVerificationUseCase,
            RefreshTokenCookie refreshTokenCookie) {
        this.registerUserUseCase = registerUserUseCase;
        this.loginUseCase = loginUseCase;
        this.refreshTokenUseCase = refreshTokenUseCase;
        this.logoutUseCase = logoutUseCase;
        this.googleLoginUseCase = googleLoginUseCase;
        this.requestPasswordResetUseCase = requestPasswordResetUseCase;
        this.resetPasswordUseCase = resetPasswordUseCase;
        this.verifyEmailUseCase = verifyEmailUseCase;
        this.resendEmailVerificationUseCase = resendEmailVerificationUseCase;
        this.refreshTokenCookie = refreshTokenCookie;
    }

    @Operation(
            summary = "Create an account",
            description =
                    "Registers a person and signs them in immediately: the response carries an access token and sets the refresh cookie. A failure to send the verification e-mail does not fail the request, because the account exists and the person is already in; the e-mail can be resent.")
    @StandardApiResponses
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<TokenResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResult result =
                registerUserUseCase.register(new RegisterCommand(request.email(), request.password(), request.name()));
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(
                        HttpHeaders.SET_COOKIE,
                        refreshTokenCookie.issue(result.refreshToken()).toString())
                .body(ApiResponse.ok(TokenResponse.from(result), "Conta criada com sucesso"));
    }

    @Operation(
            summary = "Sign in",
            description =
                    "Exchanges e-mail and password for an access token, and sets the refresh cookie. Limited to ten attempts a minute per address.")
    @StandardApiResponses
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResult result = loginUseCase.login(new LoginCommand(request.email(), request.password()));
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        refreshTokenCookie.issue(result.refreshToken()).toString())
                .body(ApiResponse.ok(TokenResponse.from(result)));
    }

    @Operation(
            summary = "Sign in with Google",
            description =
                    "Exchanges a Google ID token for a session. An account is created on first use, already verified, because Google has confirmed the address.")
    @StandardApiResponses
    @PostMapping("/oauth2/google")
    public ResponseEntity<ApiResponse<TokenResponse>> google(@Valid @RequestBody GoogleLoginRequest request) {
        AuthResult result = googleLoginUseCase.loginWithGoogle(request.idToken());
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        refreshTokenCookie.issue(result.refreshToken()).toString())
                .body(ApiResponse.ok(TokenResponse.from(result)));
    }

    /**
     * Renews the session from the cookie. There is no request body: the refresh token is
     * never handled by client script, which is the point of moving it out of localStorage.
     */
    @Operation(
            summary = "Renew the session",
            description =
                    "Reads the refresh cookie and returns a fresh pair. There is no request body on purpose: the refresh token is never handled by page script. A refresh token is single-use, and replaying a spent one revokes every token descended from that login, since a replay cannot be told apart from theft.")
    @StandardApiResponses
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(
            @CookieValue(name = RefreshTokenCookie.NAME, required = false) String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new InvalidCredentialsException("Sessão expirada. Faça login novamente.");
        }
        AuthResult result = refreshTokenUseCase.refresh(refreshToken);
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        refreshTokenCookie.issue(result.refreshToken()).toString())
                .body(ApiResponse.ok(TokenResponse.from(result)));
    }

    /**
     * Ends the session and clears the cookie.
     *
     * <p>Succeeds even without a cookie: a user clicking "log out" with an already-expired
     * session should see it work, not an error.
     */
    @Operation(
            summary = "Sign out",
            description =
                    "Revokes the whole token family and clears the cookie. Succeeds even without a cookie: someone clicking log out on an already-expired session should see it work.")
    @StandardApiResponses
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = RefreshTokenCookie.NAME, required = false) String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            logoutUseCase.logout(refreshToken);
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.clear().toString())
                .body(ApiResponse.ok(null, "Logout efetuado"));
    }

    @Operation(
            summary = "Request a password reset",
            description =
                    "Sends a reset link if the address has an account. The answer is identical either way, so the endpoint cannot be used to find out who is registered.")
    @StandardApiResponses
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        requestPasswordResetUseCase.requestReset(request.email());
        return ResponseEntity.ok(
                ApiResponse.ok(null, "Se houver uma conta com esse e-mail, enviamos um link de redefinição"));
    }

    @Operation(
            summary = "Set a new password",
            description =
                    "Consumes the token from the reset e-mail. The token is single-use and expires in thirty minutes.")
    @StandardApiResponses
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        resetPasswordUseCase.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(ApiResponse.ok(null, "Senha redefinida com sucesso"));
    }

    @Operation(
            summary = "Confirm an e-mail address",
            description = "Consumes the token from the verification e-mail. Single-use, valid for twenty-four hours.")
    @StandardApiResponses
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        verifyEmailUseCase.verify(request.token());
        return ResponseEntity.ok(ApiResponse.ok(null, "E-mail confirmado com sucesso"));
    }

    @Operation(
            summary = "Resend the verification e-mail",
            description =
                    "Sends it again if the account exists and is not yet verified. As with the reset, the answer does not reveal which.")
    @StandardApiResponses
    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerification(@Valid @RequestBody ForgotPasswordRequest request) {
        resendEmailVerificationUseCase.resend(request.email());
        return ResponseEntity.ok(
                ApiResponse.ok(null, "Se a conta existir e ainda não estiver confirmada, reenviamos o e-mail"));
    }
}
