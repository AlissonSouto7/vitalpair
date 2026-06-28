package com.aps.vitalpair.user.infrastructure.web;

import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import com.aps.vitalpair.user.application.dto.UpdateProfileCommand;
import com.aps.vitalpair.user.domain.port.in.GetProfileUseCase;
import com.aps.vitalpair.user.domain.port.in.GetTdeeUseCase;
import com.aps.vitalpair.user.domain.port.in.UpdateProfileUseCase;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final GetProfileUseCase getProfileUseCase;
    private final UpdateProfileUseCase updateProfileUseCase;
    private final GetTdeeUseCase getTdeeUseCase;

    public UserController(
            GetProfileUseCase getProfileUseCase,
            UpdateProfileUseCase updateProfileUseCase,
            GetTdeeUseCase getTdeeUseCase) {
        this.getProfileUseCase = getProfileUseCase;
        this.updateProfileUseCase = updateProfileUseCase;
        this.getTdeeUseCase = getTdeeUseCase;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> me(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        var user = getProfileUseCase.getProfile(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(UserProfileResponse.from(user)));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMe(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        var command = new UpdateProfileCommand(
                request.name(),
                request.birthDate(),
                request.sex(),
                request.heightCm(),
                request.weightKg(),
                request.goal(),
                request.activityLevel(),
                request.avatarUrl());
        var user = updateProfileUseCase.updateProfile(principal.userId(), command);
        return ResponseEntity.ok(ApiResponse.ok(UserProfileResponse.from(user), "Perfil atualizado"));
    }

    @GetMapping("/me/tdee")
    public ResponseEntity<ApiResponse<TdeeResponse>> myTdee(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        var result = getTdeeUseCase.getTdee(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(TdeeResponse.from(result)));
    }
}
