package com.aps.vitapair.feed.infrastructure.persistence;

import com.aps.vitapair.feed.domain.model.FeedItem;
import com.aps.vitapair.feed.domain.port.out.FeedItemRepositoryPort;
import com.aps.vitapair.shared.web.PageResponse;
import java.util.Optional;
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
    public Optional<FeedItem> findById(UUID id) {
        return repository.findById(id).map(mapper::toDomain);
    }

    @Override
    public PageResponse<FeedItem> findVisibleByTenant(UUID tenantId, UUID viewerId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<FeedItem> result = repository.findVisible(tenantId, viewerId, pageRequest).map(mapper::toDomain);
        return PageResponse.from(result);
    }
}
