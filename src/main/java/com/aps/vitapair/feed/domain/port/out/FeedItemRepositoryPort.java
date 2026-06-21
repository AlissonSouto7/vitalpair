package com.aps.vitapair.feed.domain.port.out;

import com.aps.vitapair.feed.domain.model.FeedItem;
import com.aps.vitapair.shared.web.PageResponse;
import java.util.UUID;

public interface FeedItemRepositoryPort {

    FeedItem save(FeedItem item);

    PageResponse<FeedItem> findByTenant(UUID tenantId, int page, int size);
}
