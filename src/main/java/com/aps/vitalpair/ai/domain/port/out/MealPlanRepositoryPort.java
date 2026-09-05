package com.aps.vitalpair.ai.domain.port.out;

import com.aps.vitalpair.ai.domain.model.MealPlan;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

/** Porta de saída de persistência do plano alimentar semanal. */
public interface MealPlanRepositoryPort {

    Optional<MealPlan> findByUserAndWeek(UUID userId, LocalDate weekStart);

    /** Salva o plano substituindo o plano existente do mesmo usuário/semana (e todos os itens). */
    MealPlan replace(MealPlan plan);

    /** Atualiza o prato de um item existente (troca de refeição), mantendo dia e tipo. */
    void updateItem(UUID itemId, String name, int kcal, int proteinG, int carbG, int fatG);
}
