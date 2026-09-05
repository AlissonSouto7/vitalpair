package com.aps.vitalpair.ai.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "workout_exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutExerciseJpaEntity {

    @Id
    @UuidGenerator
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "day_id", nullable = false)
    private UUID dayId;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int sets;

    @Column(nullable = false)
    private String reps;

    @Column(name = "rest_seconds", nullable = false)
    private int restSeconds;

    @Column(nullable = false)
    private boolean done;
}
