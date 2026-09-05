package com.aps.vitalpair.mission.infrastructure.persistence;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pair_missions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PairMissionJpaEntity {

    @Id
    @UuidGenerator
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "mission_code", nullable = false)
    private String missionCode;

    @Column(name = "mission_date", nullable = false)
    private LocalDate missionDate;

    @Column(nullable = false)
    private boolean accepted;

    @Column(name = "accepted_at")
    private Instant acceptedAt;
}
