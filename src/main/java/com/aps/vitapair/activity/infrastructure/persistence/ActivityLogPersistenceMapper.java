package com.aps.vitapair.activity.infrastructure.persistence;

import com.aps.vitapair.activity.domain.model.ActivityLog;
import org.mapstruct.Mapper;

@Mapper
public interface ActivityLogPersistenceMapper {

    ActivityLogJpaEntity toEntity(ActivityLog activityLog);

    ActivityLog toDomain(ActivityLogJpaEntity entity);
}
