package com.aps.vitalpair.mission.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.aps.vitalpair.mission.domain.model.FlashMissionView;
import com.aps.vitalpair.mission.domain.model.Mission;
import com.aps.vitalpair.mission.domain.model.MissionKind;
import com.aps.vitalpair.mission.domain.model.PairMissionState;
import com.aps.vitalpair.mission.domain.port.out.MissionCatalogRepositoryPort;
import com.aps.vitalpair.mission.domain.port.out.PairMissionRepositoryPort;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * The daily flash mission: which one today is, and what accepting it does.
 *
 * <p>The pick is deterministic from the day of the year, which is what lets both people in a
 * pair see the same mission without a row being written first. It also means the rotation is
 * arithmetic worth pinning: an off-by-one here shows two different missions to two phones.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MissionServiceTest {

    private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");
    private static final UUID USER = UUID.randomUUID();
    private static final UUID TENANT = UUID.randomUUID();

    @Mock
    private MissionCatalogRepositoryPort catalogRepository;

    @Mock
    private PairMissionRepositoryPort pairMissionRepository;

    @Mock
    private UserRepositoryPort userRepository;

    private MissionService serviceOn(LocalDate today) {
        Clock fixed = Clock.fixed(today.atTime(9, 0).atZone(SAO_PAULO).toInstant(), SAO_PAULO);
        return new MissionService(catalogRepository, pairMissionRepository, userRepository, fixed, SAO_PAULO.getId());
    }

    @Test
    void themissionOfTheDayRotatesThroughTheCatalogByDayOfTheYear() {
        givenUser();
        givenCatalog(mission("A"), mission("B"), mission("C"));

        // 1 January is day 1, so index 0: the rotation is zero-based on day-of-year minus one.
        assertThat(serviceOn(LocalDate.of(2026, 1, 1))
                        .getToday(USER)
                        .getMission()
                        .getCode())
                .isEqualTo("A");
        assertThat(serviceOn(LocalDate.of(2026, 1, 2))
                        .getToday(USER)
                        .getMission()
                        .getCode())
                .isEqualTo("B");
        assertThat(serviceOn(LocalDate.of(2026, 1, 3))
                        .getToday(USER)
                        .getMission()
                        .getCode())
                .isEqualTo("C");
        // And wraps, so a catalogue of three never runs out.
        assertThat(serviceOn(LocalDate.of(2026, 1, 4))
                        .getToday(USER)
                        .getMission()
                        .getCode())
                .isEqualTo("A");
    }

    @Test
    void bothHalvesOfApairSeeTheSameMissionWithoutArowExisting() {
        givenUser();
        givenCatalog(mission("A"), mission("B"), mission("C"));
        when(pairMissionRepository.find(any(), any())).thenReturn(Optional.empty());

        FlashMissionView view = serviceOn(LocalDate.of(2026, 5, 20)).getToday(USER);

        // Nothing was written to answer a read, and nothing had to be.
        assertThat(view.isAccepted()).isFalse();
        verify(pairMissionRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void themissionExpiresAtTheEndOfItsOwnDayInTheProductsZone() {
        givenUser();
        givenCatalog(mission("A"));
        LocalDate today = LocalDate.of(2026, 5, 20);

        FlashMissionView view = serviceOn(today).getToday(USER);

        // 23:59:59 where the product lives, not where the server happens to be: a mission that
        // expires at 21:00 local time is a mission somebody loses for no reason.
        assertThat(view.getExpiresAt())
                .isEqualTo(
                        today.atTime(LocalTime.of(23, 59, 59)).atZone(SAO_PAULO).toInstant());
    }

    @Test
    void acceptingWritesTheDayTheMissionBelongsTo() {
        givenUser();
        givenCatalog(mission("A"), mission("B"));
        LocalDate today = LocalDate.of(2026, 5, 20);
        when(pairMissionRepository.find(TENANT, today)).thenReturn(Optional.empty());
        when(pairMissionRepository.save(any())).thenAnswer(call -> call.getArgument(0));

        FlashMissionView view = serviceOn(today).acceptToday(USER);

        ArgumentCaptor<PairMissionState> saved = ArgumentCaptor.forClass(PairMissionState.class);
        verify(pairMissionRepository).save(saved.capture());
        assertThat(saved.getValue().getTenantId()).isEqualTo(TENANT);
        assertThat(saved.getValue().getDate()).isEqualTo(today);
        assertThat(saved.getValue().isAccepted()).isTrue();
        assertThat(saved.getValue().getAcceptedAt()).isNotNull();
        assertThat(view.isAccepted()).isTrue();
    }

    @Test
    void acceptingTwiceKeepsTheRowAndStaysAccepted() {
        givenUser();
        givenCatalog(mission("A"));
        LocalDate today = LocalDate.of(2026, 5, 20);
        PairMissionState existing = PairMissionState.builder()
                .tenantId(TENANT)
                .missionCode("A")
                .date(today)
                .accepted(true)
                .build();
        when(pairMissionRepository.find(TENANT, today)).thenReturn(Optional.of(existing));
        when(pairMissionRepository.save(any())).thenAnswer(call -> call.getArgument(0));

        FlashMissionView view = serviceOn(today).acceptToday(USER);

        // Both people tapping accept is normal, and the second tap is not a new mission.
        assertThat(view.isAccepted()).isTrue();
        ArgumentCaptor<PairMissionState> saved = ArgumentCaptor.forClass(PairMissionState.class);
        verify(pairMissionRepository).save(saved.capture());
        assertThat(saved.getValue().getDate()).isEqualTo(today);
    }

    @Test
    void anemptyCatalogueIsNotFoundRatherThanAnIndexError() {
        givenUser();
        when(catalogRepository.findByKind(MissionKind.FLASH)).thenReturn(List.of());

        MissionService service = serviceOn(LocalDate.of(2026, 5, 20));

        // `% 0` would be an ArithmeticException reaching the client as a 500.
        assertThatThrownBy(() -> service.getToday(USER)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void amissionForSomebodyWhoIsNotThereIsNotFound() {
        when(userRepository.findById(USER)).thenReturn(Optional.empty());

        MissionService service = serviceOn(LocalDate.of(2026, 5, 20));

        assertThatThrownBy(() -> service.getToday(USER)).isInstanceOf(ResourceNotFoundException.class);
    }

    private void givenUser() {
        when(userRepository.findById(USER))
                .thenReturn(Optional.of(User.builder()
                        .id(USER)
                        .tenantId(TENANT)
                        .timeZone(SAO_PAULO)
                        .build()));
    }

    private void givenCatalog(Mission... missions) {
        when(catalogRepository.findByKind(MissionKind.FLASH)).thenReturn(List.of(missions));
    }

    private static Mission mission(String code) {
        return Mission.builder()
                .code(code)
                .title("Missão " + code)
                .description("Faça " + code)
                .rewardPoints(10)
                .kind(MissionKind.FLASH)
                .build();
    }
}
