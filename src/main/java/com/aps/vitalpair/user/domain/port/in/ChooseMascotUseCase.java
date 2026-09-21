package com.aps.vitalpair.user.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.user.domain.model.Mascot;

/** Escolhe a aparência do mascote da pessoa. */
public interface ChooseMascotUseCase {

    /**
     * Grava a escolha.
     *
     * <p>Um endereço próprio, e não mais um campo no formulário de perfil: escolher o bicho é
     * uma ação de um toque, feita de uma tela onde o resto do perfil não está em jogo, e
     * juntá-la ao PUT do perfil obrigaria a mandar nome, peso e altura junto para trocar de
     * mascote.
     *
     * @param userId sempre quem está autenticado; não existe caminho que troque o mascote de
     *     outra pessoa
     */
    void chooseMascot(UUID userId, Mascot mascot);
}
