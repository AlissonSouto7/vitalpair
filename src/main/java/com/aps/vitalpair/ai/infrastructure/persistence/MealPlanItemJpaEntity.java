package com.aps.vitalpair.ai.infrastructure.persistence;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import com.aps.vitalpair.ai.domain.model.PlanMealType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "meal_plan_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealPlanItemJpaEntity {

    @Id
    @UuidGenerator
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "plan_id", nullable = false)
    private UUID planId;

    @Column(name = "day_index", nullable = false)
    private int dayIndex;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_type", nullable = false)
    private PlanMealType mealType;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int kcal;

    @Column(name = "protein_g", nullable = false)
    private int proteinG;

    @Column(name = "carb_g", nullable = false)
    private int carbG;

    @Column(name = "fat_g", nullable = false)
    private int fatG;
}
