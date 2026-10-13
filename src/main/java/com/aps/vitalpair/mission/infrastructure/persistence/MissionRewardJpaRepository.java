package com.aps.vitalpair.mission.infrastructure.persistence;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MissionRewardJpaRepository extends JpaRepository<MissionRewardJpaEntity, UUID> {

    @Query("select r.missionCode from MissionRewardJpaEntity r"
            + " where r.userId = :userId and r.periodStart = :periodStart")
    List<String> findCodesAwarded(@Param("userId") UUID userId, @Param("periodStart") LocalDate periodStart);
}
