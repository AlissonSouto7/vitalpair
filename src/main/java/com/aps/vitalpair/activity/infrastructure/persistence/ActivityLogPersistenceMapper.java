package com.aps.vitalpair.activity.infrastructure.persistence;

import com.aps.vitalpair.activity.domain.model.ActivityLog;
import org.mapstruct.Mapper;

@Mapper
public interface ActivityLogPersistenceMapper {

    ActivityLogJpaEntity toEntity(ActivityLog activityLog);

    ActivityLog toDomain(ActivityLogJpaEntity entity);
}
