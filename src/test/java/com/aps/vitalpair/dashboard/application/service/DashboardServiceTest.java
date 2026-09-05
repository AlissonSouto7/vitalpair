package com.aps.vitalpair.dashboard.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.aps.vitalpair.activity.application.dto.ActivitySummary;
import com.aps.vitalpair.activity.domain.port.in.GetActivitySummaryUseCase;
import com.aps.vitalpair.dashboard.application.dto.DashboardView;
import com.aps.vitalpair.nutrition.application.dto.DailySummary;
import com.aps.vitalpair.nutrition.domain.port.in.GetDailySummaryUseCase;
import com.aps.vitalpair.pair.application.dto.MemberView;
import com.aps.vitalpair.pair.application.dto.PairView;
import com.aps.vitalpair.pair.domain.model.PairStatus;
import com.aps.vitalpair.pair.domain.model.RelationshipType;
import com.aps.vitalpair.pair.domain.port.in.GetCurrentPairUseCase;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    private static final UUID ME = UUID.randomUUID();
    private static final UUID PARTNER = UUID.randomUUID();
    private static final LocalDate TODAY = LocalDate.of(2026, 6, 21);

    @Mock
    private GetDailySummaryUseCase nutritionSummary;

    @Mock
    private GetActivitySummaryUseCase activitySummary;

    @Mock
    private GetCurrentPairUseCase currentPair;

    @InjectMocks
    private DashboardService service;

    @Test
    void agregaConsumoGastoEParceiro() {
        when(nutritionSummary.getSummary(eq(ME), any())).thenReturn(nutrition(2000, 1800));
        when(activitySummary.getSummary(eq(ME), any())).thenReturn(activity(500, 8000));
        when(currentPair.getCurrentPair(ME))
                .thenReturn(pair(
                        new MemberView(ME, "Alisson", "a@a.com", null),
                        new MemberView(PARTNER, "Ana", "ana@a.com", null)));
        when(nutritionSummary.getSummary(eq(PARTNER), any())).thenReturn(nutrition(1500, 2200));
        when(activitySummary.getSummary(eq(PARTNER), any())).thenReturn(activity(300, 5000));

        DashboardView view = service.getDashboard(ME, TODAY);

        assertThat(view.me().netCalories()).isEqualTo(1500); // 2000 - 500
        assertThat(view.me().remainingCalories()).isEqualTo(300); // 1800 - 1500
        assertThat(view.me().steps()).isEqualTo(8000);
        assertThat(view.partner()).isNotNull();
        assertThat(view.partner().name()).isEqualTo("Ana");
        assertThat(view.partner().netCalories()).isEqualTo(1200); // 1500 - 300
    }

    @Test
    void semParceiroQuandoParPendente() {
        when(nutritionSummary.getSummary(eq(ME), any())).thenReturn(nutrition(1000, 1800));
        when(activitySummary.getSummary(eq(ME), any())).thenReturn(activity(0, 0));
        when(currentPair.getCurrentPair(ME)).thenReturn(pair(new MemberView(ME, "Alisson", "a@a.com", null)));

        DashboardView view = service.getDashboard(ME, TODAY);

        assertThat(view.partner()).isNull();
        assertThat(view.me().netCalories()).isEqualTo(1000);
    }

    private DailySummary nutrition(int consumed, int target) {
        return new DailySummary(TODAY, consumed, 0, 0, 0, target, 0, 0, 0, target - consumed, 1);
    }

    private ActivitySummary activity(int burned, int steps) {
        return new ActivitySummary(TODAY, burned, steps, 1);
    }

    private PairView pair(MemberView... members) {
        return new PairView(
                UUID.randomUUID(), "Par", PairStatus.ACTIVE, RelationshipType.PAIR, "CODE1234", List.of(members));
    }
}
