/**
 * Feature de temporada (30 dias) + ledger de pontos.
 *
 * <p>O ledger ({@code point_events}) registra cada award que entra no placar da competição,
 * gravado no mesmo ponto em que a gamification incrementa o {@code competition_scores}
 * (ver {@code gamification.application.listener.GamificationEventListener}). A temporada tem
 * lifecycle lazy: é garantida/fechada/aberta ao consultar {@code GET /api/v1/season}, sem scheduler.
 * Os pontos da temporada são sempre somados do ledger na janela da temporada ativa.
 */
package com.aps.vitalpair.season;
