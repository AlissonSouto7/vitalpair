package com.aps.vitapair.dashboard.application.dto;

import java.time.LocalDate;

/** Visão agregada do dia: o usuário e (se houver) o parceiro. */
public record DashboardView(LocalDate date, DayProgress me, PartnerSummary partner) {
}
