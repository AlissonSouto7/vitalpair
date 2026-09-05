package com.aps.vitalpair.notification.infrastructure.persistence;

import org.mapstruct.Mapper;

import com.aps.vitalpair.notification.domain.model.Notification;

@Mapper
public interface NotificationPersistenceMapper {

    NotificationJpaEntity toEntity(Notification notification);

    Notification toDomain(NotificationJpaEntity entity);
}
