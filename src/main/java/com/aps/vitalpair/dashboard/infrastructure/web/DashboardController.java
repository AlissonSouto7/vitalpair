package com.aps.vitalpair.dashboard.infrastructure.web;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.dashboard.domain.port.in.GetDashboardUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final GetDashboardUseCase getDashboardUseCase;

    public DashboardController(GetDashboardUseCase getDashboardUseCase) {
        this.getDashboardUseCase = getDashboardUseCase;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardResponse>> dashboard(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate date) {
        LocalDate target = date != null ? date : LocalDate.now();
        var view = getDashboardUseCase.getDashboard(principal.userId(), target);
        return ResponseEntity.ok(ApiResponse.ok(DashboardResponse.from(view)));
    }
}
