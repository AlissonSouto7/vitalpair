package com.aps.vitalpair.notification.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.aps.vitalpair.notification.domain.model.Notification;
import com.aps.vitalpair.notification.domain.model.NotificationPreferences;
import com.aps.vitalpair.notification.domain.model.NotificationType;
import com.aps.vitalpair.notification.domain.port.out.NotificationPreferencesRepositoryPort;
import com.aps.vitalpair.notification.domain.port.out.NotificationRepositoryPort;

/**
 * Whether a notification is written at all.
 *
 * <p>The preference gate is the part that had nothing asserting it, and it is the part a
 * person notices: switching the rival alert off and still being told about it is the kind of
 * bug that makes someone stop trusting the settings screen. The gate covers only the three
 * automatic types on purpose, which is also worth pinning, since "honour the preference" is
 * easy to widen into types that have no preference to read.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class NotificationServiceTest {

    private static final UUID TENANT = UUID.randomUUID();
    private static final UUID USER = UUID.randomUUID();

    @Mock
    private NotificationRepositoryPort repository;

    @Mock
    private NotificationPreferencesRepositoryPort preferencesRepository;

    @InjectMocks
    private NotificationService service;

    @ParameterizedTest
    @EnumSource(
            value = NotificationType.class,
            names = {"RIVAL_OVERTOOK", "FLASH_MISSION", "LOG_REMINDER"})
    void anautomaticNotificationIsNotWrittenWhenItsSwitchIsOff(NotificationType type) {
        when(preferencesRepository.findByUserId(USER)).thenReturn(Optional.of(allOff()));

        service.create(TENANT, USER, type, null, null, null);

        // Off means not written, not written-and-hidden: nothing to leak into a count later.
        verify(repository, never()).save(any());
    }

    @ParameterizedTest
    @EnumSource(
            value = NotificationType.class,
            names = {"RIVAL_OVERTOOK", "FLASH_MISSION", "LOG_REMINDER"})
    void anautomaticNotificationIsWrittenWhenItsSwitchIsOn(NotificationType type) {
        when(preferencesRepository.findByUserId(USER)).thenReturn(Optional.of(allOn()));

        service.create(TENANT, USER, type, null, null, null);

        verify(repository).save(any());
    }

    @Test
    void eachSwitchOnlySilencesItsOwnType() {
        // Only the rival alert is off. The other two automatic types still arrive.
        when(preferencesRepository.findByUserId(USER))
                .thenReturn(Optional.of(allOn().toBuilder().notifyRival(false).build()));

        service.create(TENANT, USER, NotificationType.RIVAL_OVERTOOK, null, null, null);
        service.create(TENANT, USER, NotificationType.FLASH_MISSION, null, null, null);
        service.create(TENANT, USER, NotificationType.LOG_REMINDER, null, null, null);

        verify(repository, org.mockito.Mockito.times(2)).save(any());
    }

    @Test
    void whatAnotherPersonDidIsAlwaysWrittenWhateverTheSwitchesSay() {
        when(preferencesRepository.findByUserId(USER)).thenReturn(Optional.of(allOff()));

        service.create(TENANT, USER, NotificationType.PARTNER_MEAL, "Célia", "Salada", null);
        service.create(TENANT, USER, NotificationType.PARTNER_ACTIVITY, "Célia", null, 300);
        service.create(TENANT, USER, NotificationType.PAIR_FORMED, null, null, null);

        // The three preferences are about the product nudging someone. A partner's own action
        // is not a nudge, and there is no switch offering to hide it.
        verify(repository, org.mockito.Mockito.times(3)).save(any());
    }

    @Test
    void withNoPreferencesStoredTheDefaultsDecide() {
        when(preferencesRepository.findByUserId(USER)).thenReturn(Optional.empty());

        service.create(TENANT, USER, NotificationType.FLASH_MISSION, null, null, null);

        // Somebody who never opened the settings screen still gets the product's default
        // behaviour rather than silence.
        assertThat(NotificationPreferences.defaultsFor(USER).isNotifyFlash()).isTrue();
        verify(repository).save(any());
    }

    @Test
    void anotificationIsWrittenUnreadWithItsOwnDetails() {
        when(preferencesRepository.findByUserId(USER)).thenReturn(Optional.of(allOn()));

        service.create(TENANT, USER, NotificationType.PARTNER_ACTIVITY, "Célia", null, 420);

        ArgumentCaptor<Notification> saved = ArgumentCaptor.forClass(Notification.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getTenantId()).isEqualTo(TENANT);
        assertThat(saved.getValue().getUserId()).isEqualTo(USER);
        assertThat(saved.getValue().getActorName()).isEqualTo("Célia");
        assertThat(saved.getValue().getAmount()).isEqualTo(420);
        assertThat(saved.getValue().isRead()).isFalse();
    }

    @Test
    void thefeedCarriesTheUnreadCountAlongsideTheItems() {
        when(repository.findRecentByUser(any(), org.mockito.ArgumentMatchers.anyInt()))
                .thenReturn(List.of(notification(NotificationType.PARTNER_MEAL)));
        when(repository.countUnread(USER)).thenReturn(7L);

        var feed = service.list(USER);

        // The count is not items.size(): the badge counts unread, the list shows the recent.
        assertThat(feed.items()).hasSize(1);
        assertThat(feed.unreadCount()).isEqualTo(7L);
    }

    private static NotificationPreferences allOn() {
        return NotificationPreferences.builder()
                .userId(USER)
                .notifyRival(true)
                .notifyFlash(true)
                .notifyReminder(true)
                .build();
    }

    private static NotificationPreferences allOff() {
        return NotificationPreferences.builder()
                .userId(USER)
                .notifyRival(false)
                .notifyFlash(false)
                .notifyReminder(false)
                .build();
    }

    private static Notification notification(NotificationType type) {
        return Notification.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT)
                .userId(USER)
                .type(type)
                .read(false)
                .build();
    }
}
