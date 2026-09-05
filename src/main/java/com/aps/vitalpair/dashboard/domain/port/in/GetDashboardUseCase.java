package com.aps.vitalpair.dashboard.domain.port.in;

import java.time.LocalDate;
import java.util.UUID;

import com.aps.vitalpair.dashboard.application.dto.DashboardView;

public interface GetDashboardUseCase {

    DashboardView getDashboard(UUID userId, LocalDate date);
}
