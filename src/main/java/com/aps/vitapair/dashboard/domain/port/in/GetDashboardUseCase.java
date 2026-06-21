package com.aps.vitapair.dashboard.domain.port.in;

import com.aps.vitapair.dashboard.application.dto.DashboardView;
import java.time.LocalDate;
import java.util.UUID;

public interface GetDashboardUseCase {

    DashboardView getDashboard(UUID userId, LocalDate date);
}
