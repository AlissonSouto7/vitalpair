package com.aps.vitalpair.pair.infrastructure.persistence;

import org.mapstruct.Mapper;

import com.aps.vitalpair.pair.domain.model.Pair;

/** Converts between the domain model {@link Pair} and the JPA entity {@link PairJpaEntity}. */
@Mapper
public interface PairPersistenceMapper {

    PairJpaEntity toEntity(Pair pair);

    Pair toDomain(PairJpaEntity entity);
}
