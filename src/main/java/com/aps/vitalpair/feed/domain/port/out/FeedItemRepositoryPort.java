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

    /**
     * Removes the item that came from a given record, if there is one.
     *
     * <p>Scoped by tenant as well as by source: the id arrives on an event and a lookup by id
     * alone would be a way to delete across pairs if one were ever forged. Finding nothing is a
     * normal outcome, not an error, because items written before source ids existed have none,
     * and a private meal still has an item to remove.
     *
     * @return how many items were removed, 0 or 1
     */
    int deleteBySource(UUID tenantId, UUID sourceId);
}
