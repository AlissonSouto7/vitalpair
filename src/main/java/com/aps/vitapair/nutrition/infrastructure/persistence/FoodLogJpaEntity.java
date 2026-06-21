package com.aps.vitapair.nutrition.infrastructure.persistence;

import com.aps.vitapair.nutrition.domain.model.FoodSource;
import com.aps.vitapair.nutrition.domain.model.MealType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "food_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodLogJpaEntity {

    @Id
    @UuidGenerator
    @Column(nullable = false, updatable = false)
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
    @Column(nullable = false)
    private FoodSource source;

    @Column(name = "is_private", nullable = false)
    private boolean isPrivate;

    @Column(name = "logged_at", nullable = false)
    private Instant loggedAt;
}
