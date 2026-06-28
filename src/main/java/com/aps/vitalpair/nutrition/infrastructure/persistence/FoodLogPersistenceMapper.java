package com.aps.vitalpair.nutrition.infrastructure.persistence;

import com.aps.vitalpair.nutrition.domain.model.FoodLog;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface FoodLogPersistenceMapper {

    // Lombok gera getter isPrivate() (propriedade "private"), mas o builder espera "isPrivate".
    @Mapping(target = "isPrivate", source = "private")
    FoodLogJpaEntity toEntity(FoodLog foodLog);

    @Mapping(target = "isPrivate", source = "private")
    FoodLog toDomain(FoodLogJpaEntity entity);
}
