package com.aps.vitalpair.notification.infrastructure.persistence;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationJpaRepository extends JpaRepository<NotificationJpaEntity, UUID> {

    List<NotificationJpaEntity> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    long countByUserIdAndReadIsFalse(UUID userId);

    @Modifying
    @Query("update NotificationJpaEntity n set n.read = true where n.userId = :userId and n.read = false")
    void markAllRead(@Param("userId") UUID userId);
}
