package com.aps.vitapair.feed.infrastructure.persistence;

import com.aps.vitapair.feed.domain.model.FeedItem;
import com.aps.vitapair.feed.domain.port.out.FeedItemRepositoryPort;
import com.aps.vitapair.shared.web.PageResponse;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Component
public class FeedItemPersistenceAdapter implements FeedItemRepositoryPort {

    private final FeedItemJpaRepository repository;
    private final FeedItemPersistenceMapper mapper;

    public FeedItemPersistenceAdapter(FeedItemJpaRepository repository, FeedItemPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public FeedItem save(FeedItem item) {
        return mapper.toDomain(repository.save(mapper.toEntity(item)));
    }

    @Override
    public PageResponse<FeedItem> findByTenant(UUID tenantId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<FeedItem> result = repository.findByTenantId(tenantId, pageRequest).map(mapper::toDomain);
        return PageResponse.from(result);
    }
}
