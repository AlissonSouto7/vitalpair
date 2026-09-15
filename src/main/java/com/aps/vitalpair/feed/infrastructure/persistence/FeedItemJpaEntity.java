package com.aps.vitalpair.feed.infrastructure.persistence;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import com.aps.vitalpair.feed.domain.model.FeedItemType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "feed_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedItemJpaEntity {

    @Id
    @UuidGenerator
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "actor_name", nullable = false)
    private String actorName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FeedItemType type;

    /**
     * The id of the food_logs or activity_logs row behind this item.
     *
     * <p>No foreign key: it points at one table or the other depending on {@code type}, which a
     * single column cannot constrain. Null on rows written before V29.
     */
    @Column(name = "source_id")
    private UUID sourceId;

    /**
     * The pre-rendered Portuguese sentence, for rows written before V29 only.
     *
     * <p>Nullable now. It was NOT NULL while the sentence was the only thing stored; new items
     * store the fields below and let the screen write the sentence in the reader's language.
     */
    @Column(name = "title")
    private String title;

    @Column(name = "subtitle")
    private String subtitle;

    @Column(name = "food_name")
    private String foodName;

    @Column(name = "meal_type")
    private String mealType;

    @Column(name = "activity_type")
    private String activityType;

    @Column(name = "calories")
    private Integer calories;

    @Column(name = "protein_g")
    private Integer proteinG;

    @Column(name = "carb_g")
    private Integer carbG;

    @Column(name = "fat_g")
    private Integer fatG;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "points", nullable = false)
    private int points;

    @Column(name = "is_private", nullable = false)
    private boolean isPrivate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
