package com.aps.vitalpair.ai.infrastructure.persistence;

import com.aps.vitalpair.ai.domain.model.MealPlan;
import com.aps.vitalpair.ai.domain.model.MealPlanItem;
import com.aps.vitalpair.ai.domain.port.out.MealPlanRepositoryPort;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Adaptador JPA do plano alimentar. {@code replace} apaga o plano existente do usuário/semana
 * (itens em cascata via delete explícito) antes de inserir o novo, respeitando o UNIQUE
 * (user_id, week_start). As leituras devolvem os itens já ordenados por dia e refeição.
 */
@Component
public class MealPlanPersistenceAdapter implements MealPlanRepositoryPort {

    private static final Comparator<MealPlanItem> ITEM_ORDER = Comparator
            .comparingInt(MealPlanItem::dayIndex)
            .thenComparing(item -> item.mealType().ordinal());

    private final MealPlanJpaRepository planRepository;
    private final MealPlanItemJpaRepository itemRepository;

    public MealPlanPersistenceAdapter(
            MealPlanJpaRepository planRepository, MealPlanItemJpaRepository itemRepository) {
        this.planRepository = planRepository;
        this.itemRepository = itemRepository;
    }

    @Override
    public Optional<MealPlan> findByUserAndWeek(UUID userId, LocalDate weekStart) {
        return planRepository.findByUserIdAndWeekStart(userId, weekStart).map(this::toDomain);
    }

    @Override
    public MealPlan replace(MealPlan plan) {
        planRepository.findByUserIdAndWeekStart(plan.userId(), plan.weekStart()).ifPresent(existing -> {
            itemRepository.deleteByPlanId(existing.getId());
            planRepository.delete(existing);
            planRepository.flush();
        });

        MealPlanJpaEntity savedPlan = planRepository.save(MealPlanJpaEntity.builder()
                .userId(plan.userId())
                .weekStart(plan.weekStart())
                .createdAt(Instant.now())
                .build());
        itemRepository.saveAll(plan.items().stream()
                .map(item -> MealPlanItemJpaEntity.builder()
                        .planId(savedPlan.getId())
                        .dayIndex(item.dayIndex())
                        .mealType(item.mealType())
                        .name(item.name())
                        .kcal(item.kcal())
                        .proteinG(item.proteinG())
                        .carbG(item.carbG())
                        .fatG(item.fatG())
                        .build())
                .toList());
        return toDomain(savedPlan);
    }

    @Override
    public void updateItem(UUID itemId, String name, int kcal, int proteinG, int carbG, int fatG) {
        itemRepository.findById(itemId).ifPresent(item -> {
            item.setName(name);
            item.setKcal(kcal);
            item.setProteinG(proteinG);
            item.setCarbG(carbG);
            item.setFatG(fatG);
            itemRepository.save(item);
        });
    }

    private MealPlan toDomain(MealPlanJpaEntity entity) {
        List<MealPlanItem> items = itemRepository.findByPlanId(entity.getId()).stream()
                .map(item -> new MealPlanItem(
                        item.getId(), item.getDayIndex(), item.getMealType(), item.getName(),
                        item.getKcal(), item.getProteinG(), item.getCarbG(), item.getFatG()))
                .sorted(ITEM_ORDER)
                .toList();
        return new MealPlan(entity.getId(), entity.getUserId(), entity.getWeekStart(), entity.getCreatedAt(), items);
    }
}
