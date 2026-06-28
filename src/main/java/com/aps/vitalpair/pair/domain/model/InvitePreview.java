package com.aps.vitalpair.pair.domain.model;

/**
 * Prévia pública de um convite, exibida na tela de aceitação antes de o convidado ter conta.
 * Não expõe e-mail nem dados sensíveis: só o primeiro nome de quem convidou, o tipo de vínculo
 * e se o convite já foi usado (par cheio).
 *
 * @param inviterName      primeiro nome de quem criou o convite
 * @param relationshipType tipo de vínculo proposto pelo par
 * @param full             {@code true} se o par já está ativo / já tem dois membros
 */
public record InvitePreview(String inviterName, RelationshipType relationshipType, boolean full) {
}
