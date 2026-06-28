package com.aps.vitalpair.pair.domain.port.in;

import com.aps.vitalpair.pair.domain.model.InvitePreview;

/** Consulta pública (sem autenticação) da prévia de um convite a partir do seu código. */
public interface GetInvitePreviewUseCase {

    /**
     * Retorna a prévia do convite identificado por {@code inviteCode}.
     *
     * @param inviteCode código do convite
     * @return prévia com o primeiro nome de quem convidou, o tipo de vínculo e se o par já está cheio
     * @throws com.aps.vitalpair.shared.exception.ResourceNotFoundException se o convite não existir
     */
    InvitePreview getInvitePreview(String inviteCode);
}
