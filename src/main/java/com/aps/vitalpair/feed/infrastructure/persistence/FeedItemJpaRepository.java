package com.aps.vitalpair.feed.infrastructure.persistence;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FeedItemJpaRepository extends JpaRepository<FeedItemJpaEntity, UUID> {

    @Query("SELECT f FROM FeedItemJpaEntity f "
            + "WHERE f.tenantId = :tenantId AND (f.isPrivate = false OR f.userId = :viewerId)")
    Page<FeedItemJpaEntity> findVisible(
            @Param("tenantId") UUID tenantId, @Param("viewerId") UUID viewerId, Pageable pageable);

    /**
     * Deletes the item a given record produced.
     *
     * <p>Scoped by tenant as well: the source id travels on an event, and a delete by id alone
     * would reach across pairs if one were ever forged. A modifying query rather than a
     * find-then-delete so the deletion is one statement.
     */
    @Modifying
    @Query("DELETE FROM FeedItemJpaEntity f WHERE f.tenantId = :tenantId AND f.sourceId = :sourceId")
    int deleteBySourceId(@Param("tenantId") UUID tenantId, @Param("sourceId") UUID sourceId);
}
