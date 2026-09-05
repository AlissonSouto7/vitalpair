package com.aps.vitalpair.mission.infrastructure.persistence;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import com.aps.vitalpair.mission.domain.model.WeeklyMissionIcon;
import com.aps.vitalpair.mission.domain.model.WeeklyMissionMetric;
import com.aps.vitalpair.mission.domain.model.WeeklyMissionScope;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "weekly_missions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyMissionJpaEntity {

    @Id
    @UuidGenerator
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String title;

    @Column
    private String subtitle;

    @Column(nullable = false)
    private int reward;

    @Column(nullable = false)
    private int target;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WeeklyMissionMetric metric;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WeeklyMissionScope scope;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WeeklyMissionIcon icon;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;
}
