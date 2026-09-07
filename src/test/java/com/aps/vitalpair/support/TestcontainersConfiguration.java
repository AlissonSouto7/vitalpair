package com.aps.vitalpair.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Real Postgres and Redis for integration tests, wired in through {@link ServiceConnection}.
 *
 * <p>The connection details from these containers take precedence over any
 * {@code spring.datasource.*} or {@code spring.data.redis.*} property, including values a
 * local {@code .env} would otherwise inject. That precedence is what keeps a test run from
 * touching the developer's own database; {@code SchemaValidationIT} asserts it.
 *
 * <p>The Postgres image matches the version production will run. A test against a
 * different major version proves nothing about the SQL the migrations actually execute.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    public static final String POSTGRES_IMAGE = "postgres:16-alpine";
    public static final String REDIS_IMAGE = "redis:7-alpine";

    @Bean
    @ServiceConnection
    PostgreSQLContainer<?> postgresContainer() {
        return new PostgreSQLContainer<>(DockerImageName.parse(POSTGRES_IMAGE));
    }

    @Bean
    @ServiceConnection(name = "redis")
    GenericContainer<?> redisContainer() {
        return new GenericContainer<>(DockerImageName.parse(REDIS_IMAGE)).withExposedPorts(6379);
    }
}
