package com.aps.vitalpair.gamification.domain.port.in;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Soma pontos ao placar da semana.
 *
 * <p>Existe como porta porque agora há um segundo lugar que concede pontos, além dos eventos
 * de refeição e atividade: a recompensa de missão. A regra de arquitetura do projeto impede
 * uma feature de chamar o serviço de outra direto, e ela está certa: o dia em que a soma de
 * pontos ganhar uma regra nova, este é o lugar único onde ela entra.
 *
 * <p>Quem chama continua sendo responsável por gravar a mesma quantia no ledger, porque são
 * dois registros com propósitos diferentes: o placar é o número da semana e o ledger é a
 * história de onde ele veio.
 */
public interface AwardPointsUseCase {

    void awardPoints(UUID tenantId, UUID userId, int points, LocalDate date);
}
