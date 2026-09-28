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

import com.aps.vitalpair.nutrition.application.dto.AddToCartCommand;
import com.aps.vitalpair.nutrition.domain.port.in.MealCartUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import com.aps.vitalpair.shared.web.StandardApiResponses;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * O carrinho: o prato sendo montado antes de virar refeição.
 *
 * <p>Cada endereço age sobre o carrinho de quem está autenticado, e só. O id do dono vem do
 * token e nunca do corpo ou do caminho, então não existe um {@code /carts/{userId}} para
 * alguém tentar apontar para outra pessoa. O par divide o diário, não o prato pela metade.
 */
@Tag(name = "Nutrition", description = "O carrinho de refeições.")
@RestController
@RequestMapping("/api/v1/nutrition/cart")
public class MealCartController {

    private final MealCartUseCase cart;

    public MealCartController(MealCartUseCase cart) {
        this.cart = cart;
    }

    @StandardApiResponses
    @Operation(
            summary = "What is in the cart",
            description =
                    "The items this person has staged for a day, oldest first. The day defaults to today in their own time zone, which is what the rest of the product means by today.")
    @GetMapping
    public ResponseEntity<ApiResponse<List<CartItemResponse>>> cart(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<CartItemResponse> itens = cart.cartOf(principal.userId(), date).stream()
                .map(CartItemResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(itens));
    }

    @StandardApiResponses
    @Operation(
            summary = "Put a food in the cart",
            description =
                    "Stages one food. Nothing reaches the diary until the cart is confirmed, so this is the cheap, reversible step: a mistake here is removed with one tap and never scored.")
    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartItemResponse>> add(
            @AuthenticationPrincipal AuthenticatedUser principal, @Valid @RequestBody AddToCartRequest request) {
        var item = cart.addToCart(
                principal.userId(),
                new AddToCartCommand(
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
                        request.consumedOn()));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(CartItemResponse.from(item), "Adicionado"));
    }

    @StandardApiResponses
    @Operation(
            summary = "Take one food out of the cart",
            description =
                    "Somebody else's item answers 404 rather than 403, exactly as the meal and activity endpoints do: a 403 would confirm the id exists, which turns this into a way to probe for them.")
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<Void>> remove(
            @AuthenticationPrincipal AuthenticatedUser principal, @PathVariable UUID itemId) {
        cart.removeFromCart(principal.userId(), itemId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Tirado do carrinho"));
    }

    @StandardApiResponses
    @Operation(summary = "Empty the cart", description = "Drops everything staged for the day without logging it.")
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clear(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        cart.clearCart(principal.userId(), date);
        return ResponseEntity.ok(ApiResponse.ok(null, "Carrinho esvaziado"));
    }

    @StandardApiResponses
    @Operation(
            summary = "Log everything in the cart",
            description =
                    "Writes every staged item to the diary and empties the cart. All or nothing: if one item fails, none of them are logged and the cart is left intact, because half a lunch recorded is worse than none.")
    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<List<FoodLogResponse>>> checkout(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<FoodLogResponse> gravadas = cart.checkout(principal.userId(), date).stream()
                .map(FoodLogResponse::from)
                .toList();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(gravadas, "Refeições registradas"));
    }
}
