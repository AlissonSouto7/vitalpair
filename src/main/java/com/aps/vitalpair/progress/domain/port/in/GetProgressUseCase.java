package com.aps.vitalpair.progress.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.progress.domain.model.ProgressView;

/**
 * Use case: build a user's Progress screen (weight history, the last 7 days of calories and the
 * macro averages).
 */
public interface GetProgressUseCase {

    ProgressView getProgress(UUID userId);
}
