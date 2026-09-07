package com.aps.vitalpair.user.infrastructure.web;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import com.aps.vitalpair.shared.web.StandardApiResponses;
import com.aps.vitalpair.user.application.dto.UpdateProfileCommand;
import com.aps.vitalpair.user.domain.port.in.GetProfileUseCase;
import com.aps.vitalpair.user.domain.port.in.GetTdeeUseCase;
import com.aps.vitalpair.user.domain.port.in.UpdateProfileUseCase;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(
        name = "Profile",
        description = "The signed-in person's profile and the calorie and macro targets derived from it.")
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

    @StandardApiResponses
    @Operation(
            summary = "The caller's profile",
            description =
                    "Name, body measurements, goal, activity level and the computed targets. Never the password hash.")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> me(@AuthenticationPrincipal AuthenticatedUser principal) {
        var user = getProfileUseCase.getProfile(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(UserProfileResponse.from(user)));
    }

    @StandardApiResponses
    @Operation(
            summary = "Replace the profile",
            description =
                    "All fields at once. The calorie target and the macro targets are recomputed by the server from height, weight, age, sex, activity and goal; a client cannot set them. `avatarUrl` must be https, because it is rendered in the partner's browser.")
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMe(
            @AuthenticationPrincipal AuthenticatedUser principal, @Valid @RequestBody UpdateProfileRequest request) {
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

    @StandardApiResponses
    @Operation(
            summary = "Basal and total daily energy",
            description =
                    "BMR (Mifflin-St Jeor), TDEE by activity multiplier, the calorie target after the goal adjustment and the macro split. Answers 422 naming the missing fields when the profile is incomplete.")
    @GetMapping("/me/tdee")
    public ResponseEntity<ApiResponse<TdeeResponse>> myTdee(@AuthenticationPrincipal AuthenticatedUser principal) {
        var result = getTdeeUseCase.getTdee(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(TdeeResponse.from(result)));
    }
}
