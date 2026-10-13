package com.aps.vitalpair.mission.infrastructure.persistence;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

import com.aps.vitalpair.mission.domain.model.MissionReward;
import com.aps.vitalpair.mission.domain.port.out.MissionRewardRepositoryPort;

/** As recompensas pagas, em Postgres. Ver {@link MissionRewardRepositoryPort}. */
@Component
public class MissionRewardPersistenceAdapter implements MissionRewardRepositoryPort {

    private final MissionRewardJpaRepository repository;

    public MissionRewardPersistenceAdapter(MissionRewardJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public boolean awardOnce(MissionReward reward) {
        /*
         * Tenta gravar e deixa o banco decidir, em vez de checar antes e gravar depois.
         *
         * Entre a checagem e a escrita existe uma janela, e ela é justamente o caso comum:
         * o painel e a tela de missões leem as missões quase ao mesmo tempo, as duas veem a
         * missão recém-completada e as duas tentam pagar. A chave única
         * (user_id, mission_code, period_start) fecha a janela no banco; aqui só traduzimos
         * a recusa dela para "já estava pago", que é o que quem chamou precisa saber.
         */
        try {
            repository.saveAndFlush(MissionRewardJpaEntity.builder()
                    .tenantId(reward.getTenantId())
                    .userId(reward.getUserId())
                    .missionCode(reward.getMissionCode())
                    .periodStart(reward.getPeriodStart())
                    .points(reward.getPoints())
                    .awardedAt(reward.getAwardedAt())
                    .build());
            return true;
        } catch (DataIntegrityViolationException e) {
            return false;
        }
    }

    @Override
    public Set<String> awardedCodes(UUID userId, LocalDate periodStart) {
        return new HashSet<>(repository.findCodesAwarded(userId, periodStart));
    }
}
