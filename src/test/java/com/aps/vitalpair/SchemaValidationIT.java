package com.aps.vitalpair;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;

import com.aps.vitalpair.support.AbstractIntegrationTest;

/**
 * The schema the migrations build is the schema the entities expect, on the database
 * version production runs.
 *
 * <p>The context starting at all is most of the test: {@code ddl-auto=validate} makes
 * Hibernate compare every mapped column with the migrated tables. What is asserted here is
 * that this protection is actually switched on, that every migration file ran, and that the
 * connection really is the container's. That last one matters because a local {@code .env}
 * points at the developer's database and spring-dotenv reads it during tests too.
 */
class SchemaValidationIT extends AbstractIntegrationTest {

    private static final Pattern VERSION = Pattern.compile("^V(\\d+)__.*\\.sql$");

    @Autowired
    private Environment environment;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private PostgreSQLContainer<?> postgres;

    @Test
    void hibernateValidatesEntitiesAgainstTheMigratedSchema() {
        assertThat(environment.getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
    }

    @Test
    void everyMigrationOnTheClasspathHasBeenApplied() throws IOException {
        Resource[] files = new PathMatchingResourcePatternResolver().getResources("classpath:db/migration/V*.sql");
        int[] versions = Arrays.stream(files)
                .map(Resource::getFilename)
                .map(VERSION::matcher)
                .filter(Matcher::matches)
                .mapToInt(m -> Integer.parseInt(m.group(1)))
                .sorted()
                .toArray();
        assertThat(versions).as("migration files on the classpath").isNotEmpty();

        Integer applied = jdbc.queryForObject(
                "select count(*) from flyway_schema_history where success and version is not null", Integer.class);
        Integer latest =
                jdbc.queryForObject("select max(version::int) from flyway_schema_history where success", Integer.class);

        assertThat(applied).isEqualTo(versions.length);
        assertThat(latest).isEqualTo(versions[versions.length - 1]);
    }

    @Test
    void connectsToTheContainerAndNotToAnyConfiguredDatabase() throws SQLException {
        String url;
        try (var connection = dataSource.getConnection()) {
            url = connection.getMetaData().getURL();
        }
        assertThat(url).isEqualTo(postgres.getJdbcUrl());
        assertThat(postgres.getDockerImageName()).contains("postgres:16");
    }
}
