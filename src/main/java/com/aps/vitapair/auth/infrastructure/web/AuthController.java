package com.aps.vitapair.auth.infrastructure.web;

import com.aps.vitapair.auth.application.dto.AuthResult;
import com.aps.vitapair.auth.application.dto.LoginCommand;
import com.aps.vitapair.auth.application.dto.RegisterCommand;
import com.aps.vitapair.auth.domain.port.in.GoogleLoginUseCase;
import com.aps.vitapair.auth.domain.port.in.LoginUseCase;
import com.aps.vitapair.auth.domain.port.in.LogoutUseCase;
import com.aps.vitapair.auth.domain.port.in.RefreshTokenUseCase;
import com.aps.vitapair.auth.domain.port.in.RegisterUserUseCase;
import com.aps.vitapair.shared.web.ApiResponse;
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

    public AuthController(
            RegisterUserUseCase registerUserUseCase,
            LoginUseCase loginUseCase,
            RefreshTokenUseCase refreshTokenUseCase,
            LogoutUseCase logoutUseCase,
            GoogleLoginUseCase googleLoginUseCase) {
        this.registerUserUseCase = registerUserUseCase;
        this.loginUseCase = loginUseCase;
        this.refreshTokenUseCase = refreshTokenUseCase;
        this.logoutUseCase = logoutUseCase;
        this.googleLoginUseCase = googleLoginUseCase;
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
}
