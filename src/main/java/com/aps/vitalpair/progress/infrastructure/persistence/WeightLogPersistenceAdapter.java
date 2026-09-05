package com.aps.vitalpair.progress.infrastructure.persistence;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import com.aps.vitalpair.progress.domain.model.WeightPoint;
import com.aps.vitalpair.progress.domain.port.out.WeightLogRepositoryPort;

@Component
public class WeightLogPersistenceAdapter implements WeightLogRepositoryPort {

    private final WeightLogJpaRepository repository;

    public WeightLogPersistenceAdapter(WeightLogJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public void upsert(UUID userId, LocalDate recordedOn, BigDecimal weightKg) {
        WeightLogJpaEntity entity = repository
                .findByUserIdAndRecordedOn(userId, recordedOn)
                .orElseGet(() -> WeightLogJpaEntity.builder()
                        .userId(userId)
                        .recordedOn(recordedOn)
                        .build());
        entity.setWeightKg(weightKg);
        repository.save(entity);
    }

    @Override
    public List<WeightPoint> findRecentByUser(UUID userId, int limit) {
        List<WeightLogJpaEntity> desc = repository.findByUserIdOrderByRecordedOnDesc(userId, PageRequest.of(0, limit));
        List<WeightPoint> chronological = new ArrayList<>(desc.size());
        for (int i = desc.size() - 1; i >= 0; i--) {
            WeightLogJpaEntity e = desc.get(i);
            chronological.add(new WeightPoint(e.getRecordedOn(), e.getWeightKg()));
        }
        return chronological;
    }
}
