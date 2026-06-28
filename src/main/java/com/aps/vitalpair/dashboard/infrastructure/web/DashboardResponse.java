package com.aps.vitalpair.dashboard.infrastructure.web;

import com.aps.vitalpair.dashboard.application.dto.DashboardView;
import java.time.LocalDate;

public record DashboardResponse(
        LocalDate date,
        DayProgressResponse me,
        PartnerResponse partner) {

    public static DashboardResponse from(DashboardView view) {
        return new DashboardResponse(
                view.date(),
                DayProgressResponse.from(view.me()),
                PartnerResponse.from(view.partner()));
    }
}
