package com.aps.vitalpair.pair.infrastructure.web;

import com.aps.vitalpair.pair.domain.model.InvitePreview;
import com.aps.vitalpair.pair.domain.model.RelationshipType;

/**
 * Resposta pública da prévia de um convite.
 *
 * @param inviterName      primeiro nome de quem convidou
 * @param relationshipType tipo de vínculo proposto
 * @param full             {@code true} se o convite já foi usado (par cheio)
 */
public record InvitePreviewResponse(String inviterName, RelationshipType relationshipType, boolean full) {

    public static InvitePreviewResponse from(InvitePreview preview) {
        return new InvitePreviewResponse(preview.inviterName(), preview.relationshipType(), preview.full());
    }
}
