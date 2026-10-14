package com.aps.vitalpair.progress.domain.model;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class ProgressWindowTest {

    @Test
    @DisplayName("the three windows are the three questions people ask")
    void theThreeWindows() {
        assertThat(ProgressWindow.WEEK.days()).isEqualTo(7);
        assertThat(ProgressWindow.MONTH.days()).isEqualTo(30);
        assertThat(ProgressWindow.QUARTER.days()).isEqualTo(90);
    }

    @Test
    @DisplayName("only the longest window groups by week, so a phone gets 13 bars and not 90")
    void onlyTheLongestWindowGroupsByWeek() {
        assertThat(ProgressWindow.WEEK.isGroupedByWeek()).isFalse();
        assertThat(ProgressWindow.MONTH.isGroupedByWeek()).isFalse();
        assertThat(ProgressWindow.QUARTER.isGroupedByWeek()).isTrue();
    }

    @ParameterizedTest(name = "days={0} resolves to that window")
    @ValueSource(ints = {7, 30, 90})
    void aKnownNumberOfDaysResolves(int days) {
        assertThat(ProgressWindow.fromDays(days).days()).isEqualTo(days);
    }

    @Test
    @DisplayName("no window asked for is the week, which is what the screen always showed")
    void noWindowAskedForIsTheWeek() {
        assertThat(ProgressWindow.fromDays(null)).isEqualTo(ProgressWindow.WEEK);
    }

    @ParameterizedTest(name = "days={0} falls back to the week instead of failing")
    @ValueSource(ints = {0, 1, 14, 60, 365, -7, Integer.MAX_VALUE})
    @DisplayName("an unknown window picks the default rather than refusing")
    void anUnknownWindowPicksTheDefault(int days) {
        // This chooses a chart. A 400 here would blank the screen because of a query string,
        // and the client that sent it is simply a different version of the app.
        assertThat(ProgressWindow.fromDays(days)).isEqualTo(ProgressWindow.WEEK);
    }
}
