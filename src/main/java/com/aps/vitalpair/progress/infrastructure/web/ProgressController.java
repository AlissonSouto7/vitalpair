package com.aps.vitalpair.progress.infrastructure.web;

import com.aps.vitalpair.progress.domain.port.in.GetProgressUseCase;
import com.aps.vitalpair.progress.domain.port.in.RecordWeightUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/progress")
public class ProgressController {

    private final GetProgressUseCase getProgressUseCase;
    private final RecordWeightUseCase recordWeightUseCase;

    public ProgressController(GetProgressUseCase getProgressUseCase, RecordWeightUseCase recordWeightUseCase) {
        this.getProgressUseCase = getProgressUseCase;
        this.recordWeightUseCase = recordWeightUseCase;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ProgressResponse>> progress(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        var view = getProgressUseCase.getProgress(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(ProgressResponse.from(view)));
    }

    @PostMapping("/weight")
    public ResponseEntity<ApiResponse<Void>> recordWeight(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody RecordWeightRequest request) {
        recordWeightUseCase.recordTodayWeight(principal.userId(), request.weightKg());
        return ResponseEntity.ok(ApiResponse.ok(null, "Peso registrado"));
    }
}
