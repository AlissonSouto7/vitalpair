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
import com.aps.vitalpair.shared.web.StandardApiResponses;
import com.aps.vitalpair.user.domain.port.in.UserDayUseCase;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Dashboard", description = "One call with everything the home screen shows for a day.")
@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final GetDashboardUseCase getDashboardUseCase;
    private final UserDayUseCase userDayUseCase;

    public DashboardController(GetDashboardUseCase getDashboardUseCase, UserDayUseCase userDayUseCase) {
        this.getDashboardUseCase = getDashboardUseCase;
        this.userDayUseCase = userDayUseCase;
    }

    @StandardApiResponses
    @Operation(
            summary = "The day's balance",
            description =
                    "Consumed, burned, net and remaining calories against the caller's target, plus the partner's summary when the pair is active. Remaining is target minus net, so exercise counts here; the nutrition summary's remaining does not include it.")
    @GetMapping
    public ResponseEntity<ApiResponse<DashboardResponse>> dashboard(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate date) {
        // Today where the caller is, not where the server runs.
        LocalDate target = date != null ? date : userDayUseCase.today(principal.userId());
        var view = getDashboardUseCase.getDashboard(principal.userId(), target);
        return ResponseEntity.ok(ApiResponse.ok(DashboardResponse.from(view)));
    }
}
