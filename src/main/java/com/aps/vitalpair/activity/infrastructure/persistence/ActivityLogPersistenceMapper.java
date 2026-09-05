package com.aps.vitalpair.activity.infrastructure.persistence;

import org.mapstruct.Mapper;

import com.aps.vitalpair.activity.domain.model.ActivityLog;

@Mapper
public interface ActivityLogPersistenceMapper {

    ActivityLogJpaEntity toEntity(ActivityLog activityLog);

    ActivityLog toDomain(ActivityLogJpaEntity entity);
}
