package com.aps.vitalpair.feed.domain.port.in;

import com.aps.vitalpair.feed.application.dto.FeedItemView;
import com.aps.vitalpair.shared.web.PageResponse;
import java.util.UUID;

public interface GetFeedUseCase {

    PageResponse<FeedItemView> getFeed(UUID userId, int page, int size);
}
