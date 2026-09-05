package com.aps.vitalpair.notification.infrastructure.persistence;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationPreferencesJpaRepository extends JpaRepository<NotificationPreferencesJpaEntity, UUID> {}
