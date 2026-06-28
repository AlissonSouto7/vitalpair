package com.aps.vitalpair.nutrition.infrastructure.web;

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
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
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

    public NutritionController(
            SearchFoodUseCase searchFoodUseCase,
            FindFoodByBarcodeUseCase findFoodByBarcodeUseCase,
            LogMealUseCase logMealUseCase,
            DeleteFoodLogUseCase deleteFoodLogUseCase,
            GetDailyLogsUseCase getDailyLogsUseCase,
            GetDailySummaryUseCase getDailySummaryUseCase,
            GetFavoriteFoodsUseCase getFavoriteFoodsUseCase) {
        this.searchFoodUseCase = searchFoodUseCase;
        this.findFoodByBarcodeUseCase = findFoodByBarcodeUseCase;
        this.logMealUseCase = logMealUseCase;
        this.deleteFoodLogUseCase = deleteFoodLogUseCase;
        this.getDailyLogsUseCase = getDailyLogsUseCase;
        this.getDailySummaryUseCase = getDailySummaryUseCase;
        this.getFavoriteFoodsUseCase = getFavoriteFoodsUseCase;
    }

    @GetMapping("/foods/search")
    public ResponseEntity<ApiResponse<List<FoodProductResponse>>> search(@RequestParam("q") String query) {
        List<FoodProductResponse> products = searchFoodUseCase.search(query).stream()
                .map(FoodProductResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(products));
    }

    @GetMapping("/foods/barcode/{code}")
    public ResponseEntity<ApiResponse<FoodProductResponse>> byBarcode(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.ok(FoodProductResponse.from(findFoodByBarcodeUseCase.findByBarcode(code))));
    }

    @PostMapping("/logs")
    public ResponseEntity<ApiResponse<FoodLogResponse>> log(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody LogMealRequest request) {
        var command = new LogMealCommand(
                request.foodName(), request.barcode(), request.quantityG(), request.caloriesKcal(),
                request.proteinG(), request.carbG(), request.fatG(),
                request.mealType(), request.source(), request.isPrivate(), request.loggedAt());
        var saved = logMealUseCase.logMeal(principal.userId(), command);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(FoodLogResponse.from(saved), "Refeição registrada"));
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<List<FoodLogResponse>>> logs(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<FoodLogResponse> logs = getDailyLogsUseCase.getLogs(principal.userId(), orToday(date)).stream()
                .map(FoodLogResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }

    @DeleteMapping("/logs/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id) {
        deleteFoodLogUseCase.delete(principal.userId(), id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Registro removido"));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DailySummaryResponse>> summary(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        var summary = getDailySummaryUseCase.getSummary(principal.userId(), orToday(date));
        return ResponseEntity.ok(ApiResponse.ok(DailySummaryResponse.from(summary)));
    }

    @GetMapping("/favorites")
    public ResponseEntity<ApiResponse<List<FavoriteFoodResponse>>> favorites(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        List<FavoriteFoodResponse> favorites = getFavoriteFoodsUseCase.getFavorites(principal.userId()).stream()
                .map(FavoriteFoodResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(favorites));
    }

    private static LocalDate orToday(LocalDate date) {
        return date != null ? date : LocalDate.now();
    }
}
