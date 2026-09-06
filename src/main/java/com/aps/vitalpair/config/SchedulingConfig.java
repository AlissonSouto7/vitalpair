package com.aps.vitalpair.config;

import javax.sql.DataSource;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;

/**
 * Makes a scheduled job run once per schedule rather than once per instance.
 *
 * <p>Without the lock, two instances running the same cron both send every user their daily
 * notification. That is invisible in development, where there is only ever one instance, and
 * immediately visible to users on the first rolling deploy.
 *
 * <p>{@code defaultLockAtMostFor} is the safety net for an instance that dies holding the
 * lock: after that long the row is considered stale and another instance may take over. Ten
 * minutes is comfortably longer than either job takes and short enough that a crash does not
 * skip a whole day.
 */
@Configuration
@EnableSchedulerLock(defaultLockAtMostFor = "PT10M")
public class SchedulingConfig {

    @Bean
    LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(JdbcTemplateLockProvider.Configuration.builder()
                .withJdbcTemplate(new org.springframework.jdbc.core.JdbcTemplate(dataSource))
                // Postgres stores timestamps without a zone here, so the provider is told to
                // use UTC rather than the JVM's zone. Two instances in different zones would
                // otherwise disagree about when a lock expires.
                .usingDbTime()
                .build());
    }
}
