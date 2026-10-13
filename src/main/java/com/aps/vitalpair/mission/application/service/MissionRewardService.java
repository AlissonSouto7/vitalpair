package com.aps.vitalpair.mission.application.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.gamification.domain.port.in.AwardPointsUseCase;
import com.aps.vitalpair.mission.domain.model.MissionReward;
import com.aps.vitalpair.mission.domain.port.out.MissionRewardRepositoryPort;
import com.aps.vitalpair.season.domain.model.PointSource;
import com.aps.vitalpair.season.domain.port.in.RecordPointUseCase;

/**
 * Paga a recompensa de uma missão cumprida, uma vez só.
 *
 * <p>O catálogo declara quanto cada missão vale desde que existe, a tela mostra "+50 pts" em
 * verde, e nada concedia esses pontos. Medido em 28/09/2026 contra o servidor local: topar a
 * missão de 50 pontos deixava o placar em 25, e a linha "Missões" do resumo da temporada
 * nunca aparecia, porque linhas zeradas dos dois lados são suprimidas. A pessoa cumpria e
 * ganhava nada.
 *
 * <p><b>Quando paga:</b> na leitura, quando o progresso mostra a missão completa. As missões
 * semanais não guardam progresso: ele é contado dos registros reais a cada leitura, então não
 * existe um instante de "acabou de completar" para escutar. Pagar na leitura é o que funciona
 * com esse desenho, e é seguro porque a trava é do banco, não do código.
 *
 * <p><b>Por que não pode pagar duas vezes:</b> a chave única
 * {@code (user_id, mission_code, period_start)} decide. Abrir a tela dez vezes tenta gravar
 * dez vezes e nove batem na trava. Isso vale também para duas requisições simultâneas, que é
 * o caso comum de quem abre o painel e a tela de missões juntos.
 */
@Service
public class MissionRewardService {

    private final MissionRewardRepositoryPort rewards;
    private final AwardPointsUseCase scoreboard;
    private final RecordPointUseCase pointLedger;
    private final Clock clock;

    public MissionRewardService(
            MissionRewardRepositoryPort rewards,
            AwardPointsUseCase scoreboard,
            RecordPointUseCase pointLedger,
            Clock clock) {
        this.rewards = rewards;
        this.scoreboard = scoreboard;
        this.pointLedger = pointLedger;
        this.clock = clock;
    }

    /**
     * Paga, se ainda não tiver pago.
     *
     * @param periodStart a segunda-feira da semana, para a missão semanal; o dia, para a
     *     relâmpago. É o que separa "cumpri de novo na semana seguinte" de "abri a tela duas
     *     vezes"
     * @return true quando esta chamada foi a que pagou
     */
    @Transactional
    public boolean awardIfNew(UUID tenantId, UUID userId, String missionCode, LocalDate periodStart, int points) {
        if (points <= 0) {
            return false;
        }
        boolean pagou = rewards.awardOnce(MissionReward.builder()
                .tenantId(tenantId)
                .userId(userId)
                .missionCode(missionCode)
                .periodStart(periodStart)
                .points(points)
                .awardedAt(clock.instant())
                .build());
        if (!pagou) {
            return false;
        }

        /*
         * Placar e ledger no mesmo ponto, como o listener de refeição e atividade faz. São
         * dois registros com propósitos diferentes: o placar é o número da semana, o ledger é
         * a história de onde ele veio, e o resumo da temporada é somado do ledger. Escrever
         * só num dos dois é como o número da tela e o do resumo passam a discordar.
         *
         * A data é a de hoje, e não a do início do período: os pontos entram no dia em que a
         * missão foi cumprida, que é quando a pessoa fez por merecer.
         */
        LocalDate hoje = LocalDate.now(clock);
        scoreboard.awardPoints(tenantId, userId, points, hoje);
        pointLedger.record(tenantId, userId, PointSource.MISSION, points, hoje);
        return true;
    }

    /** O que esta pessoa já recebeu no período, para a tela não reoferecer. */
    @Transactional(readOnly = true)
    public Set<String> alreadyAwarded(UUID userId, LocalDate periodStart) {
        return rewards.awardedCodes(userId, periodStart);
    }
}
