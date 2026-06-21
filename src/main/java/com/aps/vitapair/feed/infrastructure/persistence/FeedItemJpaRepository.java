package com.aps.vitapair.feed.infrastructure.persistence;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedItemJpaRepository extends JpaRepository<FeedItemJpaEntity, UUID> {

    Page<FeedItemJpaEntity> findByTenantId(UUID tenantId, Pageable pageable);
}
