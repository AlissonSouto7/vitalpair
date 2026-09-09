package com.aps.vitalpair.nutrition.infrastructure.web;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
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

import com.aps.vitalpair.nutrition.application.dto.LogMealCommand;
import com.aps.vitalpair.nutrition.domain.port.in.DeleteFoodLogUseCase;
import com.aps.vitalpair.nutrition.domain.port.in.FindFoodByBarcodeUseCase;
import com.aps.vitalpair.nutrition.domain.port.in.GetDailyLogsUseCase;
import com.aps.vitalpair.nutrition.domain.port.in.GetDailySummaryUseCase;
import com.aps.vitalpair.nutrition.domain.port.in.GetFavoriteFoodsUseCase;
import com.aps.vitalpair.nutrition.domain.port.in.LogMealUseCase;
import com.aps.vitalpair.nutrition.domain.port.in.SearchFoodUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import com.aps.vitalpair.shared.web.StandardApiResponses;
import com.aps.vitalpair.user.domain.port.in.UserDayUseCase;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Nutrition", description = "Searching foods, logging meals and reading the day's totals.")
@RestController
@RequestMapping("/api/v1/nutrition")
public class NutritionController {

    private final SearchFoodUseCase searchFoodUseCase;
    private final FindFoodByBarcodeUseCase findFoodByBarcodeUseCase;
    private final LogMealUseCase logMealUseCase;
    private final DeleteFoodLogUseCase deleteFoodLogUseCase;
    private final GetDailyLogsUseCase getDailyLogsUseCase;
    private final GetDailySummaryUseCase getDailySummaryUseCase;
    private final GetFavoriteFoodsUseCase getFavoriteFoodsUseCase;
    private final UserDayUseCase userDayUseCase;

    public NutritionController(
            SearchFoodUseCase searchFoodUseCase,
            FindFoodByBarcodeUseCase findFoodByBarcodeUseCase,
            LogMealUseCase logMealUseCase,
            DeleteFoodLogUseCase deleteFoodLogUseCase,
            GetDailyLogsUseCase getDailyLogsUseCase,
            GetDailySummaryUseCase getDailySummaryUseCase,
            GetFavoriteFoodsUseCase getFavoriteFoodsUseCase,
            UserDayUseCase userDayUseCase) {
        this.searchFoodUseCase = searchFoodUseCase;
        this.findFoodByBarcodeUseCase = findFoodByBarcodeUseCase;
        this.logMealUseCase = logMealUseCase;
        this.deleteFoodLogUseCase = deleteFoodLogUseCase;
        this.getDailyLogsUseCase = getDailyLogsUseCase;
        this.getDailySummaryUseCase = getDailySummaryUseCase;
        this.getFavoriteFoodsUseCase = getFavoriteFoodsUseCase;
        this.userDayUseCase = userDayUseCase;
    }

    @StandardApiResponses
    @Operation(
            summary = "Search foods by name",
            description =
                    "Queries Open Food Facts. An upstream failure returns an empty list rather than an error, so a partner outage degrades the search box instead of breaking the screen.")
    @GetMapping("/foods/search")
    public ResponseEntity<ApiResponse<List<FoodProductResponse>>> search(@RequestParam("q") String query) {
        List<FoodProductResponse> products = searchFoodUseCase.search(query).stream()
                .map(FoodProductResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(products));
    }

    @StandardApiResponses
    @Operation(
            summary = "Look up a product by barcode",
            description = "One product from Open Food Facts, or 404 when the barcode is unknown.")
    @GetMapping("/foods/barcode/{code}")
    public ResponseEntity<ApiResponse<FoodProductResponse>> byBarcode(@PathVariable String code) {
        return ResponseEntity.ok(
                ApiResponse.ok(FoodProductResponse.from(findFoodByBarcodeUseCase.findByBarcode(code))));
    }

    @StandardApiResponses
    @Operation(
            summary = "Log a meal",
            description =
                    "Records what was eaten with its macros. The tenant is taken from the session, never from the body. Publishes an event that scores points, appears in the pair's feed unless the meal is private, and notifies the partner.")
    @PostMapping("/logs")
    public ResponseEntity<ApiResponse<FoodLogResponse>> log(
            @AuthenticationPrincipal AuthenticatedUser principal, @Valid @RequestBody LogMealRequest request) {
        var command = new LogMealCommand(
                request.foodName(),
                request.barcode(),
                request.quantityG(),
                request.caloriesKcal(),
                request.proteinG(),
                request.carbG(),
                request.fatG(),
                request.mealType(),
                request.source(),
                request.isPrivate(),
                request.loggedAt());
        var saved = logMealUseCase.logMeal(principal.userId(), command);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(FoodLogResponse.from(saved), "Refeição registrada"));
    }

    @StandardApiResponses
    @Operation(
            summary = "The day's meals",
            description = "Every meal the caller logged on the given date, defaulting to today, oldest first.")
    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<List<FoodLogResponse>>> logs(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate date) {
        List<FoodLogResponse> logs = getDailyLogsUseCase.getLogs(principal.userId(), orToday(principal, date)).stream()
                .map(FoodLogResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }

    @StandardApiResponses
    @Operation(
            summary = "Delete a meal",
            description = "Deletes one of the caller's own meals. Someone else's answers 404, not 403.")
    @DeleteMapping("/logs/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal AuthenticatedUser principal, @PathVariable UUID id) {
        deleteFoodLogUseCase.delete(principal.userId(), id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Registro removido"));
    }

    @StandardApiResponses
    @Operation(
            summary = "Calories and macros for a day",
            description =
                    "Totals against the caller's targets. `remaining` is null when no target is set, and does not subtract exercise; the dashboard's remaining does.")
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DailySummaryResponse>> summary(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate date) {
        var summary = getDailySummaryUseCase.getSummary(principal.userId(), orToday(principal, date));
        return ResponseEntity.ok(ApiResponse.ok(DailySummaryResponse.from(summary)));
    }

    @StandardApiResponses
    @Operation(
            summary = "The caller's most repeated foods",
            description =
                    "The eight food names logged most often, each with the quantity and macros of its most recent entry, for one-tap re-logging.")
    @GetMapping("/favorites")
    public ResponseEntity<ApiResponse<List<FavoriteFoodResponse>>> favorites(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        List<FavoriteFoodResponse> favorites = getFavoriteFoodsUseCase.getFavorites(principal.userId()).stream()
                .map(FavoriteFoodResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(favorites));
    }

    /**
     * The requested date, or today where the caller is.
     *
     * <p>Not {@code LocalDate.now()}: that is today where the server is, which used to
     * disagree with the window the query ran over and made a meal logged late in the evening
     * vanish from the day it belonged to.
     */
    private LocalDate orToday(AuthenticatedUser principal, LocalDate date) {
        return date != null ? date : userDayUseCase.today(principal.userId());
    }
}
