package com.aps.vitalpair.notification.infrastructure.persistence;

import com.aps.vitalpair.notification.domain.model.Notification;
import org.mapstruct.Mapper;

@Mapper
public interface NotificationPersistenceMapper {

    NotificationJpaEntity toEntity(Notification notification);

    Notification toDomain(NotificationJpaEntity entity);
}
