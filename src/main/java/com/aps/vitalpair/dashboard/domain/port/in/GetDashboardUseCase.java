package com.aps.vitalpair.dashboard.domain.port.in;

import com.aps.vitalpair.dashboard.application.dto.DashboardView;
import java.time.LocalDate;
import java.util.UUID;

public interface GetDashboardUseCase {

    DashboardView getDashboard(UUID userId, LocalDate date);
}
