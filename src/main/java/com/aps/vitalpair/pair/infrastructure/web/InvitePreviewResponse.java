package com.aps.vitalpair.pair.infrastructure.web;

import com.aps.vitalpair.pair.domain.model.InvitePreview;
import com.aps.vitalpair.pair.domain.model.RelationshipType;

/**
 * The public response of an invite preview.
 *
 * @param inviterName      the inviter's first name
 * @param relationshipType the relationship type proposed
 * @param full             {@code true} when the invite is already used (the pair is full)
 */
public record InvitePreviewResponse(String inviterName, RelationshipType relationshipType, boolean full) {

    public static InvitePreviewResponse from(InvitePreview preview) {
        return new InvitePreviewResponse(preview.inviterName(), preview.relationshipType(), preview.full());
    }
}
