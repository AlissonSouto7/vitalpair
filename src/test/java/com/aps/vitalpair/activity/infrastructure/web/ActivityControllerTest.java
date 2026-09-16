package com.aps.vitalpair.activity.infrastructure.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.aps.vitalpair.activity.application.dto.ActivitySummary;
import com.aps.vitalpair.activity.domain.model.ActivityLog;
import com.aps.vitalpair.activity.domain.model.ActivitySource;
import com.aps.vitalpair.activity.domain.model.ActivityType;
import com.aps.vitalpair.activity.domain.port.in.DeleteActivityLogUseCase;
import com.aps.vitalpair.activity.domain.port.in.GetActivitySummaryUseCase;
import com.aps.vitalpair.activity.domain.port.in.GetDailyActivitiesUseCase;
import com.aps.vitalpair.activity.domain.port.in.LogActivityUseCase;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.support.ControllerSliceTest;
import com.aps.vitalpair.support.security.WithVitalPairUser;
import com.aps.vitalpair.user.domain.port.in.UserDayUseCase;

/**
 * The activity endpoints, including the delete that did not exist until now.
 *
 * <p>A meal could be deleted and a workout could not, so one logged by mistake stayed in the
 * diary and in the partner's timeline for good. The 404-for-somebody-else's-record case is the
 * one worth asserting: a 403 would confirm the id exists and turn the endpoint into a way to
 * probe for them.
 */
@WebMvcTest(ActivityController.class)
class ActivityControllerTest extends ControllerSliceTest {

    private static final UUID LOG_ID = UUID.randomUUID();

    @MockitoBean
    private LogActivityUseCase logActivityUseCase;

    @MockitoBean
    private GetDailyActivitiesUseCase getDailyActivitiesUseCase;

    @MockitoBean
    private GetActivitySummaryUseCase getActivitySummaryUseCase;

    @MockitoBean
    private DeleteActivityLogUseCase deleteActivityLogUseCase;

    @MockitoBean
    private UserDayUseCase userDayUseCase;

    private static ActivityLog aRun() {
        return ActivityLog.builder()
                .id(LOG_ID)
                .tenantId(UUID.randomUUID())
                .userId(UUID.randomUUID())
                .activityType(ActivityType.RUN)
                .caloriesBurned(new BigDecimal("320"))
                .durationMinutes(35)
                .source(ActivitySource.MANUAL)
                .loggedAt(Instant.parse("2026-06-21T12:00:00Z"))
                .build();
    }

    @Test
    @WithVitalPairUser
    void loggingAnactivityAnswersCreated() throws Exception {
        when(logActivityUseCase.logActivity(any(), any())).thenReturn(aRun());

        mockMvc.perform(post("/api/v1/activity/logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of(
                                "activityType",
                                "RUN",
                                "source",
                                "MANUAL",
                                "caloriesBurned",
                                320,
                                "durationMinutes",
                                35))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.activityType").value("RUN"));
    }

    @Test
    @WithVitalPairUser
    void anactivityWithoutAtypeIsRefused() throws Exception {
        mockMvc.perform(post("/api/v1/activity/logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("source", "MANUAL"))))
                .andExpect(status().isBadRequest());

        verify(logActivityUseCase, never()).logActivity(any(), any());
    }

    @Test
    void loggingWithoutAsessionIsRefused() throws Exception {
        mockMvc.perform(post("/api/v1/activity/logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("activityType", "RUN", "source", "MANUAL"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithVitalPairUser
    void thedayListDefaultsToTodayWhereTheCallerIs() throws Exception {
        when(userDayUseCase.today(any())).thenReturn(LocalDate.of(2026, 6, 21));
        when(getDailyActivitiesUseCase.getActivities(any(), eq(LocalDate.of(2026, 6, 21))))
                .thenReturn(List.of(aRun()));

        mockMvc.perform(get("/api/v1/activity/logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].activityType").value("RUN"));

        // The caller's day, not the server's: asking the server would put a 21:00 workout in
        // Brazil on the wrong date.
        verify(userDayUseCase).today(any());
    }

    @Test
    @WithVitalPairUser
    void thesummaryAnswersTotalsForTheDay() throws Exception {
        when(userDayUseCase.today(any())).thenReturn(LocalDate.of(2026, 6, 21));
        when(getActivitySummaryUseCase.getSummary(any(), any()))
                .thenReturn(new ActivitySummary(LocalDate.of(2026, 6, 21), 420, 8400, 2));

        mockMvc.perform(get("/api/v1/activity/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalCaloriesBurned").value(420))
                .andExpect(jsonPath("$.data.totalSteps").value(8400));
    }

    @Test
    @WithVitalPairUser
    void deletingAnactivityAnswersOk() throws Exception {
        mockMvc.perform(delete("/api/v1/activity/logs/{id}", LOG_ID)).andExpect(status().isOk());

        verify(deleteActivityLogUseCase).delete(any(), eq(LOG_ID));
    }

    @Test
    @WithVitalPairUser
    void deletingSomebodyElsesActivityAnswersNotFound() throws Exception {
        org.mockito.Mockito.doThrow(ResourceNotFoundException.of("Registro", LOG_ID))
                .when(deleteActivityLogUseCase)
                .delete(any(), eq(LOG_ID));

        // 404 and not 403. A 403 would say "this exists but is not yours", which is a yes/no
        // oracle for ids somebody is guessing at.
        mockMvc.perform(delete("/api/v1/activity/logs/{id}", LOG_ID)).andExpect(status().isNotFound());
    }

    @Test
    void deletingWithoutAsessionIsRefused() throws Exception {
        mockMvc.perform(delete("/api/v1/activity/logs/{id}", LOG_ID)).andExpect(status().isUnauthorized());

        verify(deleteActivityLogUseCase, never()).delete(any(), any());
    }

    @Test
    @WithVitalPairUser
    void anidThatIsNotAuuidIsAclientError() throws Exception {
        mockMvc.perform(delete("/api/v1/activity/logs/{id}", "not-a-uuid")).andExpect(status().isBadRequest());

        verify(deleteActivityLogUseCase, never()).delete(any(), any());
    }
}
