/**
 * Persistence adapter of nutrition: {@code FoodLogJpaEntity} (the Hibernate mapping, with
 * {@code tenant_id}), {@code FoodLogJpaRepository} (Spring Data) and
 * {@code FoodLogPersistenceAdapter}, which implements the outbound port by converting between
 * domain.model and the JpaEntity. Every query is scoped by the owning user.
 */
package com.aps.vitalpair.nutrition.infrastructure.persistence;
