package com.aps.vitapair.feed.domain.port.in;

import com.aps.vitapair.feed.domain.model.FeedItem;
import com.aps.vitapair.shared.web.PageResponse;
import java.util.UUID;

public interface GetFeedUseCase {

    PageResponse<FeedItem> getFeed(UUID userId, int page, int size);
}
