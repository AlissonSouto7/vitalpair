package com.aps.vitalpair.feed.domain.port.out;

import com.aps.vitalpair.feed.domain.model.FeedItem;
import com.aps.vitalpair.shared.web.PageResponse;
import java.util.Optional;
import java.util.UUID;

public interface FeedItemRepositoryPort {

    FeedItem save(FeedItem item);

    Optional<FeedItem> findById(UUID id);

    /** Itens do tenant visíveis para o usuário: públicos ou de autoria do próprio. */
    PageResponse<FeedItem> findVisibleByTenant(UUID tenantId, UUID viewerId, int page, int size);
}
