package com.aps.vitalpair.feed.infrastructure.web;

import com.aps.vitalpair.feed.application.dto.FeedItemView;
import com.aps.vitalpair.feed.domain.model.ReactionType;
import com.aps.vitalpair.feed.domain.port.in.GetFeedUseCase;
import com.aps.vitalpair.feed.domain.port.in.ReactToFeedItemUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import com.aps.vitalpair.shared.web.PageResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pair/feed")
public class FeedController {

    private static final int MAX_SIZE = 50;

    private final GetFeedUseCase getFeedUseCase;
    private final ReactToFeedItemUseCase reactToFeedItemUseCase;

    public FeedController(GetFeedUseCase getFeedUseCase, ReactToFeedItemUseCase reactToFeedItemUseCase) {
        this.getFeedUseCase = getFeedUseCase;
        this.reactToFeedItemUseCase = reactToFeedItemUseCase;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<FeedItemResponse>>> feed(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        PageResponse<FeedItemView> result = getFeedUseCase.getFeed(principal.userId(), page, Math.min(size, MAX_SIZE));
        List<FeedItemResponse> content = result.content().stream().map(FeedItemResponse::from).toList();
        PageResponse<FeedItemResponse> body = new PageResponse<>(
                content, result.page(), result.size(), result.totalElements(), result.totalPages(), result.last());
        return ResponseEntity.ok(ApiResponse.ok(body));
    }

    @PostMapping("/{itemId}/reactions")
    public ResponseEntity<ApiResponse<Void>> react(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID itemId,
            @Valid @RequestBody ReactionRequest request) {
        reactToFeedItemUseCase.react(principal.userId(), itemId, request.type());
        return ResponseEntity.ok(ApiResponse.ok(null, "Reação registrada"));
    }

    @DeleteMapping("/{itemId}/reactions/{type}")
    public ResponseEntity<ApiResponse<Void>> removeReaction(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID itemId,
            @PathVariable ReactionType type) {
        reactToFeedItemUseCase.removeReaction(principal.userId(), itemId, type);
        return ResponseEntity.ok(ApiResponse.ok(null, "Reação removida"));
    }
}
