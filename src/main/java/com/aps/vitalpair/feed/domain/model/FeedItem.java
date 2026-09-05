package com.aps.vitalpair.feed.domain.model;

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
    private final String subtitle;
    private final int points;
    private final boolean isPrivate;
    private final Instant createdAt;
}
