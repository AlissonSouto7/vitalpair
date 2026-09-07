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
     * The user's weight history, newest first, limited through {@link Pageable}. The application
     * layer reverses it into chronological order.
     */
    List<WeightLogJpaEntity> findByUserIdOrderByRecordedOnDesc(UUID userId, Pageable pageable);
}
