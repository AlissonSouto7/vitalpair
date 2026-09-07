package com.aps.vitalpair.feed.infrastructure.web;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.feed.application.dto.FeedItemView;
import com.aps.vitalpair.feed.domain.model.ReactionType;
import com.aps.vitalpair.feed.domain.port.in.GetFeedUseCase;
import com.aps.vitalpair.feed.domain.port.in.ReactToFeedItemUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import com.aps.vitalpair.shared.web.PageResponse;
import com.aps.vitalpair.shared.web.StandardApiResponses;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Feed", description = "What the pair has been doing, and reacting to it.")
@RestController
@Validated
@RequestMapping("/api/v1/pair/feed")
public class FeedController {

    private static final int MAX_SIZE = 50;

    private final GetFeedUseCase getFeedUseCase;
    private final ReactToFeedItemUseCase reactToFeedItemUseCase;

    public FeedController(GetFeedUseCase getFeedUseCase, ReactToFeedItemUseCase reactToFeedItemUseCase) {
        this.getFeedUseCase = getFeedUseCase;
        this.reactToFeedItemUseCase = reactToFeedItemUseCase;
    }

    @StandardApiResponses
    @Operation(
            summary = "The pair's timeline",
            description =
                    "Items logged by either member of the pair, newest first. A meal marked private is visible only to its author. `size` is capped at 50.")
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<FeedItemResponse>>> feed(
            @AuthenticationPrincipal AuthenticatedUser principal,
            // Bounded below as well as above: a negative page or size reached PageRequest.of
            // and threw, so bad input from a client came back as 500. A 500 says the server
            // is broken, which sends the reader hunting through logs for a fault that is not
            // there, and buries the ones that are.
            @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(value = "size", defaultValue = "20") @Min(1) int size) {
        PageResponse<FeedItemView> result = getFeedUseCase.getFeed(principal.userId(), page, Math.min(size, MAX_SIZE));
        List<FeedItemResponse> content =
                result.content().stream().map(FeedItemResponse::from).toList();
        PageResponse<FeedItemResponse> body = new PageResponse<>(
                content, result.page(), result.size(), result.totalElements(), result.totalPages(), result.last());
        return ResponseEntity.ok(ApiResponse.ok(body));
    }

    @StandardApiResponses
    @Operation(
            summary = "React to an item",
            description =
                    "Adds a FIRE, EYE or STRENGTH reaction. Reacting twice with the same type does nothing. An item from another pair answers 404, not 403, so the endpoint cannot be used to probe ids.")
    @PostMapping("/{itemId}/reactions")
    public ResponseEntity<ApiResponse<Void>> react(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID itemId,
            @Valid @RequestBody ReactionRequest request) {
        reactToFeedItemUseCase.react(principal.userId(), itemId, request.type());
        return ResponseEntity.ok(ApiResponse.ok(null, "Reação registrada"));
    }

    @StandardApiResponses
    @Operation(
            summary = "Remove your reaction",
            description = "Removes one of the caller's own reactions from an item.")
    @DeleteMapping("/{itemId}/reactions/{type}")
    public ResponseEntity<ApiResponse<Void>> removeReaction(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID itemId,
            @PathVariable ReactionType type) {
        reactToFeedItemUseCase.removeReaction(principal.userId(), itemId, type);
        return ResponseEntity.ok(ApiResponse.ok(null, "Reação removida"));
    }
}
