package com.aps.vitapair.feed.infrastructure.web;

import com.aps.vitapair.feed.domain.model.FeedItem;
import com.aps.vitapair.feed.domain.port.in.GetFeedUseCase;
import com.aps.vitapair.shared.security.AuthenticatedUser;
import com.aps.vitapair.shared.web.ApiResponse;
import com.aps.vitapair.shared.web.PageResponse;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pair/feed")
public class FeedController {

    private static final int MAX_SIZE = 50;

    private final GetFeedUseCase getFeedUseCase;

    public FeedController(GetFeedUseCase getFeedUseCase) {
        this.getFeedUseCase = getFeedUseCase;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<FeedItemResponse>>> feed(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        PageResponse<FeedItem> result = getFeedUseCase.getFeed(principal.userId(), page, Math.min(size, MAX_SIZE));
        List<FeedItemResponse> content = result.content().stream().map(FeedItemResponse::from).toList();
        PageResponse<FeedItemResponse> body = new PageResponse<>(
                content, result.page(), result.size(), result.totalElements(), result.totalPages(), result.last());
        return ResponseEntity.ok(ApiResponse.ok(body));
    }
}
