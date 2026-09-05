package com.aps.vitalpair.activity.infrastructure.persistence;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityLogJpaRepository extends JpaRepository<ActivityLogJpaEntity, UUID> {

    List<ActivityLogJpaEntity> findByUserIdAndLoggedAtGreaterThanEqualAndLoggedAtLessThanOrderByLoggedAtAsc(
            UUID userId, Instant start, Instant end);
}
