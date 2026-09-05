package com.aps.vitalpair.feed.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.feed.application.dto.FeedItemView;
import com.aps.vitalpair.shared.web.PageResponse;

public interface GetFeedUseCase {

    PageResponse<FeedItemView> getFeed(UUID userId, int page, int size);
}
