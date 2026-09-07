package com.aps.vitalpair.dashboard.domain.model;

import java.time.LocalDate;

/** The day's aggregate view: the user and, when there is one, the partner. */
public record DashboardView(LocalDate date, DayProgress me, PartnerSummary partner) {}
