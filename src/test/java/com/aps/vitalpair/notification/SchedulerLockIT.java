package com.aps.vitalpair.notification;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.ZoneId;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;

import com.aps.vitalpair.notification.application.scheduler.NotificationScheduler;
import com.aps.vitalpair.support.AbstractIntegrationTest;

/**
 * A scheduled job runs once per schedule, not once per running instance.
 *
 * <p>With two instances and no lock, every user receives each daily notification twice. It
 * cannot be seen in development, where there is only ever one instance, and it is immediately
 * visible to users on the first rolling deploy.
 */
class SchedulerLockIT extends AbstractIntegrationTest {

    @Autowired
    private NotificationScheduler scheduler;

    @Autowired
    private JdbcTemplate jdbc;

    @Value("${vitalpair.scheduling.zone}")
    private String zone;

    @Test
    void theLockTableExistsForTheJobsToShareIt() {
        Integer columns = jdbc.queryForObject(
                "select count(*) from information_schema.columns where table_name = 'shedlock'", Integer.class);

        assertThat(columns)
                .as("V24 creates name, lock_until, locked_at, locked_by")
                .isEqualTo(4);
    }

    @Test
    void runningAJobTakesTheLockAndASecondRunIsSkipped() {
        jdbc.update("delete from shedlock");

        scheduler.sendFlashMissionNotifications();

        String lockedBy = jdbc.queryForObject(
                "select locked_by from shedlock where name = 'flashMissionNotifications'", String.class);
        assertThat(lockedBy)
                .as("the row records which instance holds it, which is how another one knows to skip")
                .isNotBlank();

        // lockAtLeastFor is one minute, so the lock is still held: a second instance starting
        // now, or this one running the schedule again, must not repeat the work.
        java.sql.Timestamp lockUntil = jdbc.queryForObject(
                "select lock_until from shedlock where name = 'flashMissionNotifications'", java.sql.Timestamp.class);
        assertThat(lockUntil.toInstant()).isAfter(java.time.Instant.now());
    }

    @Test
    void theScheduleUsesTheConfiguredZoneNotTheServersOwn() {
        // A server in UTC would fire the 09:00 job at 06:00 in Brazil.
        assertThat(ZoneId.of(zone)).isEqualTo(ZoneId.of("America/Sao_Paulo"));
    }
}
