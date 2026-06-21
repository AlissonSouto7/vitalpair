package com.aps.vitapair.nutrition.infrastructure.persistence;

import com.aps.vitapair.nutrition.domain.model.FoodLog;
import org.mapstruct.Mapper;

@Mapper
public interface FoodLogPersistenceMapper {

    FoodLogJpaEntity toEntity(FoodLog foodLog);

    FoodLog toDomain(FoodLogJpaEntity entity);
}
