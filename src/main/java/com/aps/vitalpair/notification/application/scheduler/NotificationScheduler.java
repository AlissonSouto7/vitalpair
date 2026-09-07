package com.aps.vitalpair.notification.application.scheduler;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.aps.vitalpair.notification.domain.model.NotificationType;
import com.aps.vitalpair.notification.domain.port.in.CreateNotificationUseCase;
import com.aps.vitalpair.notification.domain.port.out.DailyLogMetricsRepositoryPort;
import com.aps.vitalpair.pair.domain.model.Pair;
import com.aps.vitalpair.pair.domain.model.PairStatus;
import com.aps.vitalpair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;

/**
 * The time-driven notifications: the flash mission and the end-of-day reminder. Each user is
 * processed on their own (try/catch), so one failure does not take the job down. Preference
 * filtering lives in {@code NotificationService.create}; this class only decides "when, and
 * who is a candidate".
 *
 * <p>Times are in the zone configured by {@code vitalpair.scheduling.zone}, not the server's. A
 * server in UTC would fire the 09:00 mission at 06:00 in Brasilia, too early for a
 * notification, and the "today" of the 20:00 reminder would change day in the middle of the
 * night.
 *
 * <p>{@link SchedulerLock} guarantees that with more than one instance running only one
 * executes the job: without it every user would receive the notification once per instance.
 */
@Component
public class NotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(NotificationScheduler.class);

    private final CreateNotificationUseCase notifications;
    private final UserRepositoryPort userRepository;
    private final PairRepositoryPort pairRepository;
    private final DailyLogMetricsRepositoryPort dailyLogMetrics;
    private final ZoneId zone;

    public NotificationScheduler(
            CreateNotificationUseCase notifications,
            UserRepositoryPort userRepository,
            PairRepositoryPort pairRepository,
            DailyLogMetricsRepositoryPort dailyLogMetrics,
            @Value("${vitalpair.scheduling.zone}") String zone) {
        this.notifications = notifications;
        this.userRepository = userRepository;
        this.pairRepository = pairRepository;
        this.dailyLogMetrics = dailyLogMetrics;
        this.zone = ZoneId.of(zone);
    }

    /** 09:00 every day: announces the flash mission to everyone in an ACTIVE pair. */
    @Scheduled(cron = "${vitalpair.scheduling.flash-mission-cron}", zone = "${vitalpair.scheduling.zone}")
    @SchedulerLock(name = "flashMissionNotifications", lockAtLeastFor = "PT1M")
    public void sendFlashMissionNotifications() {
        List<User> users = userRepository.findAll();
        int sent = 0;
        for (User user : users) {
            try {
                if (!belongsToActivePair(user)) {
                    continue;
                }
                notifications.create(
                        user.getTenantId(), user.getId(), NotificationType.FLASH_MISSION, null, null, null);
                sent++;
            } catch (RuntimeException ex) {
                log.warn("Falha ao enviar FLASH_MISSION para usuário {}", user.getId(), ex);
            }
        }
        log.info("Flash mission notifications sent to {} of {} users", sent, users.size());
    }

    /** 20:00 every day: reminds whoever has logged nothing today, neither a meal nor an activity. */
    @Scheduled(cron = "${vitalpair.scheduling.log-reminder-cron}", zone = "${vitalpair.scheduling.zone}")
    @SchedulerLock(name = "logReminderNotifications", lockAtLeastFor = "PT1M")
    public void sendLogReminderNotifications() {
        LocalDate today = LocalDate.now(zone);
        Instant start = today.atStartOfDay(zone).toInstant();
        Instant end = today.plusDays(1).atStartOfDay(zone).toInstant();

        List<User> users = userRepository.findAll();
        int sent = 0;
        for (User user : users) {
            try {
                long meals = dailyLogMetrics.countFoodLogs(user.getId(), start, end);
                long activities = dailyLogMetrics.countActivityLogs(user.getId(), start, end);
                if (meals == 0 && activities == 0) {
                    notifications.create(
                            user.getTenantId(), user.getId(), NotificationType.LOG_REMINDER, null, null, null);
                    sent++;
                }
            } catch (RuntimeException ex) {
                log.warn("Falha ao enviar LOG_REMINDER para usuário {}", user.getId(), ex);
            }
        }
        log.info("Log reminder notifications sent to {} of {} users", sent, users.size());
    }

    private boolean belongsToActivePair(User user) {
        Pair pair = pairRepository.findById(user.getTenantId()).orElse(null);
        return pair != null && pair.getStatus() == PairStatus.ACTIVE;
    }
}
