package com.aps.vitapair.user.infrastructure.persistence;

import com.aps.vitapair.user.domain.model.ActivityLevel;
import com.aps.vitapair.user.domain.model.Goal;
import com.aps.vitapair.user.domain.model.Sex;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserJpaEntity {

    @Id
    @UuidGenerator
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(nullable = false)
    private String name;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    private Sex sex;

    @Column(name = "height_cm")
    private BigDecimal heightCm;

    @Column(name = "weight_kg")
    private BigDecimal weightKg;

    @Enumerated(EnumType.STRING)
    private Goal goal;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_level")
    private ActivityLevel activityLevel;

    @Column(name = "daily_calorie_target")
    private Integer dailyCalorieTarget;

    @Column(name = "protein_target_g")
    private Integer proteinTargetG;

    @Column(name = "carb_target_g")
    private Integer carbTargetG;

    @Column(name = "fat_target_g")
    private Integer fatTargetG;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
