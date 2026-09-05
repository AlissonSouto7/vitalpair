package com.aps.vitalpair.notification.application.scheduler;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

/**
 * Agendadores das notificações geradas no tempo (missão relâmpago e lembrete de fim de dia).
 * Cada usuário é processado isoladamente (try/catch), para que uma falha pontual não derrube o job.
 * O filtro por preferência fica no {@code NotificationService.create}, então aqui só decidimos o
 * "quando/para quem candidato". "Hoje" usa {@link ZoneId#systemDefault()}.
 */
@Component
public class NotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(NotificationScheduler.class);

    private final CreateNotificationUseCase notifications;
    private final UserRepositoryPort userRepository;
    private final PairRepositoryPort pairRepository;
    private final DailyLogMetricsRepositoryPort dailyLogMetrics;

    public NotificationScheduler(
            CreateNotificationUseCase notifications,
            UserRepositoryPort userRepository,
            PairRepositoryPort pairRepository,
            DailyLogMetricsRepositoryPort dailyLogMetrics) {
        this.notifications = notifications;
        this.userRepository = userRepository;
        this.pairRepository = pairRepository;
        this.dailyLogMetrics = dailyLogMetrics;
    }

    /** 09:00 todo dia: avisa a missão relâmpago para quem está num par ATIVO. */
    @Scheduled(cron = "0 0 9 * * *")
    public void sendFlashMissionNotifications() {
        List<User> users = userRepository.findAll();
        for (User user : users) {
            try {
                if (!belongsToActivePair(user)) {
                    continue;
                }
                notifications.create(
                        user.getTenantId(), user.getId(), NotificationType.FLASH_MISSION, null, null, null);
            } catch (RuntimeException ex) {
                log.warn("Falha ao enviar FLASH_MISSION para usuário {}", user.getId(), ex);
            }
        }
    }

    /** 20:00 todo dia: lembra quem ainda não registrou nada (refeição nem atividade) hoje. */
    @Scheduled(cron = "0 0 20 * * *")
    public void sendLogReminderNotifications() {
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        Instant start = today.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        List<User> users = userRepository.findAll();
        for (User user : users) {
            try {
                long meals = dailyLogMetrics.countFoodLogs(user.getId(), start, end);
                long activities = dailyLogMetrics.countActivityLogs(user.getId(), start, end);
                if (meals == 0 && activities == 0) {
                    notifications.create(
                            user.getTenantId(), user.getId(), NotificationType.LOG_REMINDER, null, null, null);
                }
            } catch (RuntimeException ex) {
                log.warn("Falha ao enviar LOG_REMINDER para usuário {}", user.getId(), ex);
            }
        }
    }

    private boolean belongsToActivePair(User user) {
        Pair pair = pairRepository.findById(user.getTenantId()).orElse(null);
        return pair != null && pair.getStatus() == PairStatus.ACTIVE;
    }
}
