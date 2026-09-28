package com.aps.vitalpair.nutrition.infrastructure.persistence;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.aps.vitalpair.nutrition.domain.model.CartItem;

@Mapper
public interface CartItemPersistenceMapper {

    // Lombok gera getter isPrivate() (propriedade "private"), mas o builder espera "isPrivate".
    @Mapping(target = "isPrivate", source = "private")
    CartItemJpaEntity toEntity(CartItem item);

    @Mapping(target = "isPrivate", source = "private")
    CartItem toDomain(CartItemJpaEntity entity);
}
