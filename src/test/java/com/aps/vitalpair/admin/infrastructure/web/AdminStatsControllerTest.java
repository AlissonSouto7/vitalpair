package com.aps.vitalpair.admin.infrastructure.web;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

import com.aps.vitalpair.support.ControllerSliceTest;
import com.aps.vitalpair.support.security.WithVitalPairUser;

/**
 * Proves that the role guard on the admin endpoint actually denies.
 *
 * <p>Worth a test of its own because @PreAuthorize fails silently when method security is
 * not enabled: the annotation is simply ignored and the endpoint looks guarded while being
 * wide open. Nothing in a normal run would reveal that.
 */
@WebMvcTest(AdminStatsController.class)
@Import(AdminStatsControllerTest.MethodSecurityForTest.class)
class AdminStatsControllerTest extends ControllerSliceTest {

    /**
     * @EnableMethodSecurity lives on SecurityConfig, which a slice test does not load. Without
     * re-enabling it here every test would pass regardless of role, which is exactly the
     * false confidence this class exists to prevent.
     */
    @TestConfiguration
    @EnableMethodSecurity
    static class MethodSecurityForTest {

        @Bean
        JdbcTemplate jdbcTemplate() {
            return org.mockito.Mockito.mock(JdbcTemplate.class);
        }
    }

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    @WithVitalPairUser
    void deniesAPlainUser() throws Exception {
        mockMvc.perform(get("/api/v1/admin/stats")).andExpect(status().isForbidden());
    }

    @Test
    void deniesAnAnonymousCaller() throws Exception {
        mockMvc.perform(get("/api/v1/admin/stats")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithVitalPairUser(role = "ADMIN")
    void allowsAnAdmin() throws Exception {
        when(jdbc.queryForObject(anyString(), eq(Long.class))).thenReturn(7L);

        mockMvc.perform(get("/api/v1/admin/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.users").value(7));
    }
}
