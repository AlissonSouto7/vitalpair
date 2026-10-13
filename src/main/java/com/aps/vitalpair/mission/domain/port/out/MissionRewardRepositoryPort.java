package com.aps.vitalpair.mission.domain.port.out;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import com.aps.vitalpair.mission.domain.model.MissionReward;

/** As recompensas de missão já pagas. */
public interface MissionRewardRepositoryPort {

    /**
     * Grava a recompensa, se ela ainda não existir.
     *
     * <p>A decisão de pagar ou não é do banco, e não de uma leitura seguida de escrita: a
     * chave única {@code (user_id, mission_code, period_start)} é o que impede pagar duas
     * vezes quando duas requisições chegam juntas, que é o caso comum de quem abre a tela e
     * o painel ao mesmo tempo.
     *
     * @return true quando esta chamada foi a que pagou; false quando já estava pago
     */
    boolean awardOnce(MissionReward reward);

    /** Os códigos de missão que esta pessoa já recebeu no período. */
    Set<String> awardedCodes(UUID userId, LocalDate periodStart);
}
