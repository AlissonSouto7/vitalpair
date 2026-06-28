package com.aps.vitalpair.progress.infrastructure.persistence;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WeightLogJpaRepository extends JpaRepository<WeightLogJpaEntity, UUID> {

    Optional<WeightLogJpaEntity> findByUserIdAndRecordedOn(UUID userId, LocalDate recordedOn);

    /**
     * Histórico de peso do usuário, do mais recente para o mais antigo, limitado
     * via {@link Pageable}. A camada de aplicação inverte para ordem cronológica.
     */
    List<WeightLogJpaEntity> findByUserIdOrderByRecordedOnDesc(UUID userId, Pageable pageable);
}
