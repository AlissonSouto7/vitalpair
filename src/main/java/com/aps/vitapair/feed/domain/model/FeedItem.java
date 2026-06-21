package com.aps.vitapair.feed.domain.model;

import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

/** Item da timeline compartilhada do par. Imutável. */
@Getter
@Builder(toBuilder = true)
public class FeedItem {

    private final UUID id;
    private final UUID tenantId;
    private final UUID userId;
    private final String actorName;
    private final FeedItemType type;
    private final String title;
    private final Instant createdAt;
}
