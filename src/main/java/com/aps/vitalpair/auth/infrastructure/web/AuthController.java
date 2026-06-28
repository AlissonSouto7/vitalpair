package com.aps.vitalpair.auth.infrastructure.web;

import com.aps.vitalpair.auth.application.dto.AuthResult;
import com.aps.vitalpair.auth.application.dto.LoginCommand;
import com.aps.vitalpair.auth.application.dto.RegisterCommand;
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
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    public AuthController(
            RegisterUserUseCase registerUserUseCase,
            LoginUseCase loginUseCase,
            RefreshTokenUseCase refreshTokenUseCase,
            LogoutUseCase logoutUseCase,
            GoogleLoginUseCase googleLoginUseCase,
            RequestPasswordResetUseCase requestPasswordResetUseCase,
            ResetPasswordUseCase resetPasswordUseCase,
            VerifyEmailUseCase verifyEmailUseCase,
            ResendEmailVerificationUseCase resendEmailVerificationUseCase) {
        this.registerUserUseCase = registerUserUseCase;
        this.loginUseCase = loginUseCase;
        this.refreshTokenUseCase = refreshTokenUseCase;
        this.logoutUseCase = logoutUseCase;
        this.googleLoginUseCase = googleLoginUseCase;
        this.requestPasswordResetUseCase = requestPasswordResetUseCase;
        this.resetPasswordUseCase = resetPasswordUseCase;
        this.verifyEmailUseCase = verifyEmailUseCase;
        this.resendEmailVerificationUseCase = resendEmailVerificationUseCase;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<TokenResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResult result = registerUserUseCase.register(
                new RegisterCommand(request.email(), request.password(), request.name()));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(TokenResponse.from(result), "Conta criada com sucesso"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResult result = loginUseCase.login(new LoginCommand(request.email(), request.password()));
        return ResponseEntity.ok(ApiResponse.ok(TokenResponse.from(result)));
    }

    @PostMapping("/oauth2/google")
    public ResponseEntity<ApiResponse<TokenResponse>> google(@Valid @RequestBody GoogleLoginRequest request) {
        AuthResult result = googleLoginUseCase.loginWithGoogle(request.idToken());
        return ResponseEntity.ok(ApiResponse.ok(TokenResponse.from(result)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(@Valid @RequestBody RefreshRequest request) {
        AuthResult result = refreshTokenUseCase.refresh(request.refreshToken());
        return ResponseEntity.ok(ApiResponse.ok(TokenResponse.from(result)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody RefreshRequest request) {
        logoutUseCase.logout(request.refreshToken());
        return ResponseEntity.ok(ApiResponse.ok(null, "Logout efetuado"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        requestPasswordResetUseCase.requestReset(request.email());
        return ResponseEntity.ok(ApiResponse.ok(
                null, "Se houver uma conta com esse e-mail, enviamos um link de redefinição"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        resetPasswordUseCase.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(ApiResponse.ok(null, "Senha redefinida com sucesso"));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        verifyEmailUseCase.verify(request.token());
        return ResponseEntity.ok(ApiResponse.ok(null, "E-mail confirmado com sucesso"));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerification(@Valid @RequestBody ForgotPasswordRequest request) {
        resendEmailVerificationUseCase.resend(request.email());
        return ResponseEntity.ok(ApiResponse.ok(
                null, "Se a conta existir e ainda não estiver confirmada, reenviamos o e-mail"));
    }
}
