package com.aps.vitalpair.dashboard.domain.model;

import java.time.LocalDate;

/** Visão agregada do dia: o usuário e (se houver) o parceiro. */
public record DashboardView(LocalDate date, DayProgress me, PartnerSummary partner) {}
