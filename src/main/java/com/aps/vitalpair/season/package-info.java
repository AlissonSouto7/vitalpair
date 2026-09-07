/**
 * Feature <b>season</b>: the thirty-day season plus the points ledger.
 *
 * <p>The ledger ({@code point_events}) records every award that enters the competition
 * scoreboard, written at the same point where gamification increments
 * {@code competition_scores} (see {@code gamification.application.listener.GamificationEventListener}).
 * The season's lifecycle is lazy: it is guaranteed, closed and opened when
 * {@code GET /api/v1/season} is read, with no scheduler. Season points are always summed from
 * the ledger over the active season's window.
 */
package com.aps.vitalpair.season;
