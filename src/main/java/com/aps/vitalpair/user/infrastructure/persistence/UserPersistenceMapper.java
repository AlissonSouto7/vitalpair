package com.aps.vitalpair.user.infrastructure.persistence;

import org.mapstruct.Mapper;

import com.aps.vitalpair.user.domain.model.User;

/** Converts between the domain model {@link User} and the JPA entity {@link UserJpaEntity}. */
@Mapper
public interface UserPersistenceMapper {

    UserJpaEntity toEntity(User user);

    User toDomain(UserJpaEntity entity);
}
