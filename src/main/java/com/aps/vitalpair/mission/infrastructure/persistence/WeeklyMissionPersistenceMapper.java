package com.aps.vitalpair.mission.infrastructure.persistence;

import org.springframework.stereotype.Component;

import com.aps.vitalpair.mission.domain.model.WeeklyMission;

@Component
public class WeeklyMissionPersistenceMapper {

    public WeeklyMission toDomain(WeeklyMissionJpaEntity entity) {
        return WeeklyMission.builder()
                .code(entity.getCode())
                .title(entity.getTitle())
                .subtitle(entity.getSubtitle())
                .reward(entity.getReward())
                .target(entity.getTarget())
                .metric(entity.getMetric())
                .scope(entity.getScope())
                .icon(entity.getIcon())
                .displayOrder(entity.getDisplayOrder())
                .build();
    }
}
