package com.aps.vitalpair.pair.domain.model;

/**
 * The public preview of an invite, shown on the acceptance screen before the guest has an
 * account. Exposes no e-mail and nothing sensitive: only the inviter's first name, the
 * relationship type and whether the invite is already used (the pair is full).
 *
 * @param inviterName      the first name of whoever created the invite
 * @param relationshipType the relationship type the pair proposes
 * @param full             {@code true} when the pair is already active or already has two members
 */
public record InvitePreview(String inviterName, RelationshipType relationshipType, boolean full) {}
