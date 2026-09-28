package com.aps.vitalpair.nutrition.infrastructure.persistence;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import com.aps.vitalpair.nutrition.domain.model.FoodSource;
import com.aps.vitalpair.nutrition.domain.model.MealType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Uma linha de {@code meal_cart_items}. Ver a migração V31 para as decisões de esquema. */
@Entity
@Table(name = "meal_cart_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class CartItemJpaEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "food_name", nullable = false)
    private String foodName;

    @Column(name = "barcode")
    private String barcode;

    @Column(name = "quantity_g", nullable = false)
    private BigDecimal quantityG;

    @Column(name = "calories_kcal", nullable = false)
    private BigDecimal caloriesKcal;

    @Column(name = "protein_g", nullable = false)
    private BigDecimal proteinG;

    @Column(name = "carb_g", nullable = false)
    private BigDecimal carbG;

    @Column(name = "fat_g", nullable = false)
    private BigDecimal fatG;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_type", nullable = false)
    private MealType mealType;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false)
    private FoodSource source;

    @Column(name = "is_private", nullable = false)
    private boolean isPrivate;

    @Column(name = "consumed_on", nullable = false)
    private LocalDate consumedOn;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
}
