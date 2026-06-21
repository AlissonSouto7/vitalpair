package com.aps.vitapair.feed.domain.port.in;

import com.aps.vitapair.feed.application.dto.FeedItemView;
import com.aps.vitapair.shared.web.PageResponse;
import java.util.UUID;

public interface GetFeedUseCase {

    PageResponse<FeedItemView> getFeed(UUID userId, int page, int size);
}
