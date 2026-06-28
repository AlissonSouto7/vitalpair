package com.aps.vitalpair.feed.infrastructure.persistence;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FeedItemJpaRepository extends JpaRepository<FeedItemJpaEntity, UUID> {

    @Query("SELECT f FROM FeedItemJpaEntity f "
            + "WHERE f.tenantId = :tenantId AND (f.isPrivate = false OR f.userId = :viewerId)")
    Page<FeedItemJpaEntity> findVisible(
            @Param("tenantId") UUID tenantId, @Param("viewerId") UUID viewerId, Pageable pageable);
}
