package com.aps.vitalpair.pair.domain.port.in;

import com.aps.vitalpair.pair.domain.model.InvitePreview;

/** Public (unauthenticated) lookup of an invite's preview from its code. */
public interface GetInvitePreviewUseCase {

    /**
     * The preview of the invite identified by {@code inviteCode}.
     *
     * @param inviteCode the invite code
     * @return the inviter's first name, the relationship type and whether the pair is already full
     * @throws com.aps.vitalpair.shared.exception.ResourceNotFoundException when the invite does not exist
     */
    InvitePreview getInvitePreview(String inviteCode);
}
