package com.aps.vitalpair.progress.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.progress.domain.model.ProgressView;
import com.aps.vitalpair.progress.domain.model.ProgressWindow;

/**
 * Use case: build a user's Progress screen (weight history, the last 7 days of calories and the
 * macro averages).
 */
public interface GetProgressUseCase {

    /**
     * The progress screen over a window.
     *
     * <p>The window used to be fixed at seven days, which answers "how was my week" and
     * nothing else: somebody six weeks into a change had no way of seeing the change.
     */
    ProgressView getProgress(UUID userId, ProgressWindow window);
}
