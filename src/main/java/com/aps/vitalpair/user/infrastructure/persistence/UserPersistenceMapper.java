package com.aps.vitalpair.user.infrastructure.persistence;

import com.aps.vitalpair.user.domain.model.User;
import org.mapstruct.Mapper;

/** Converte entre o modelo de domínio {@link User} e a entidade JPA {@link UserJpaEntity}. */
@Mapper
public interface UserPersistenceMapper {

    UserJpaEntity toEntity(User user);

    User toDomain(UserJpaEntity entity);
}
