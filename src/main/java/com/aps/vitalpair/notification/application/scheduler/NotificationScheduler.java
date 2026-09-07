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
 * Agendadores das notificações geradas no tempo (missão relâmpago e lembrete de fim de dia).
 * Cada usuário é processado isoladamente (try/catch), para que uma falha pontual não derrube o job.
 * O filtro por preferência fica no {@code NotificationService.create}, então aqui só decidimos o
 * "quando/para quem candidato".
 *
 * <p>Os horários são do fuso configurado em {@code vitalpair.scheduling.zone}, não o do servidor.
 * Um servidor em UTC dispararia a missão das 09:00 às 06:00 de Brasília, o que é cedo demais para
 * uma notificação, e o "hoje" do lembrete das 20:00 mudaria de dia no meio da noite.
 *
 * <p>{@link SchedulerLock} garante que, com mais de uma instância no ar, apenas uma execute o job:
 * sem ele, cada usuário receberia a notificação uma vez por instância.
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

    /** 09:00 todo dia: avisa a missão relâmpago para quem está num par ATIVO. */
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

    /** 20:00 todo dia: lembra quem ainda não registrou nada (refeição nem atividade) hoje. */
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
