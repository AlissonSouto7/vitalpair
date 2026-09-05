package com.aps.vitalpair.pair.infrastructure.persistence;

import org.mapstruct.Mapper;

import com.aps.vitalpair.pair.domain.model.Pair;

/** Converte entre o modelo de domínio {@link Pair} e a entidade JPA {@link PairJpaEntity}. */
@Mapper
public interface PairPersistenceMapper {

    PairJpaEntity toEntity(Pair pair);

    Pair toDomain(PairJpaEntity entity);
}
