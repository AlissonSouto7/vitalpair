package com.aps.vitapair.user.infrastructure.persistence;

import com.aps.vitapair.user.domain.model.User;
import org.mapstruct.Mapper;

/** Converte entre o modelo de domínio {@link User} e a entidade JPA {@link UserJpaEntity}. */
@Mapper
public interface UserPersistenceMapper {

    UserJpaEntity toEntity(User user);

    User toDomain(UserJpaEntity entity);
}
