package com.aps.vitalpair.feed.domain.port.out;

import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.feed.domain.model.FeedItem;
import com.aps.vitalpair.shared.web.PageResponse;

public interface FeedItemRepositoryPort {

    FeedItem save(FeedItem item);

    Optional<FeedItem> findById(UUID id);

    /** The tenant's items visible to the user: public ones, plus the user's own private ones. */
    PageResponse<FeedItem> findVisibleByTenant(UUID tenantId, UUID viewerId, int page, int size);
}
