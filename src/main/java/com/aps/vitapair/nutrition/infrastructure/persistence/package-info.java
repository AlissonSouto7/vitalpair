/**
 * Adaptador de persistência de nutrition: {@code FoodLogJpaEntity} (mapeamento Hibernate, com
 * {@code tenant_id}), {@code FoodLogJpaRepository} (Spring Data) e {@code FoodLogPersistenceAdapter},
 * que implementa a porta de saída convertendo domain.model ↔ JpaEntity e aplicando o filtro de tenant.
 */
package com.aps.vitapair.nutrition.infrastructure.persistence;
