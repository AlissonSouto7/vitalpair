package com.aps.vitapair.notification.infrastructure.persistence;

import com.aps.vitapair.notification.domain.model.Notification;
import org.mapstruct.Mapper;

@Mapper
public interface NotificationPersistenceMapper {

    NotificationJpaEntity toEntity(Notification notification);

    Notification toDomain(NotificationJpaEntity entity);
}
