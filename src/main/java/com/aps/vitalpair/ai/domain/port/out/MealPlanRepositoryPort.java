package com.aps.vitalpair.ai.domain.port.out;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.ai.domain.model.MealPlan;

/**
 * Porta de saída de persistência do plano alimentar semanal.
 *
 * <p>Toda operação recebe o tenant além do usuário. Filtrar só por {@code userId} funcionaria,
 * já que um usuário pertence a um par, mas deixaria a linha acessível a qualquer consulta que
 * esquecesse o filtro; com o tenant explícito, um id de outro par simplesmente não encontra nada.
 */
public interface MealPlanRepositoryPort {

    Optional<MealPlan> findByUserAndWeek(UUID userId, UUID tenantId, LocalDate weekStart);

    /** Salva o plano substituindo o plano existente do mesmo usuário/semana (e todos os itens). */
    MealPlan replace(MealPlan plan);

    /**
     * Atualiza o prato de um item existente (troca de refeição), mantendo dia e tipo.
     *
     * @param planId plano ao qual o item precisa pertencer; um item de outro plano não é alterado
     */
    void updateItem(UUID planId, UUID itemId, String name, int kcal, int proteinG, int carbG, int fatG);
}
