package com.aps.vitalpair.admin.infrastructure.web;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.shared.web.ApiResponse;

/**
 * Operational counts, for checking whether anyone is actually using the product.
 *
 * <p>This exists to make the role mechanism real. Roles that guard nothing are decoration,
 * and a permission check nobody exercises is a permission check nobody notices is broken.
 * The numbers are also genuinely useful: there is no other way to answer "how many pairs
 * exist" without opening a database console.
 *
 * <p>Counts only. No endpoint here returns another user's data, so an admin cannot read
 * private information through it.
 */
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminStatsController {

    private final JdbcTemplate jdbc;

    public AdminStatsController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStats>> stats() {
        return ResponseEntity.ok(ApiResponse.ok(new AdminStats(
                count("SELECT count(*) FROM users"),
                count("SELECT count(*) FROM users WHERE email_verified = true"),
                count("SELECT count(*) FROM pairs"),
                count("SELECT count(*) FROM pairs WHERE status = 'ACTIVE'"),
                count("SELECT count(*) FROM food_logs"),
                count("SELECT count(*) FROM activity_logs"))));
    }

    private long count(String sql) {
        Long value = jdbc.queryForObject(sql, Long.class);
        return value == null ? 0L : value;
    }

    /** Counts across the whole installation, not scoped to any tenant. */
    public record AdminStats(
            long users, long verifiedUsers, long pairs, long activePairs, long foodLogs, long activityLogs) {}
}
