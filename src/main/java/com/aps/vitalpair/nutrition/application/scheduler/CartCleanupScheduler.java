package com.aps.vitalpair.nutrition.application.scheduler;

import java.time.Clock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.nutrition.domain.port.out.CartRepositoryPort;

/**
 * Apaga os carrinhos que ninguém confirmou.
 *
 * <p>Um carrinho abandonado é lixo com data de validade: a pessoa montou meio prato, fechou o
 * aplicativo e não voltou. Sem esta varredura a tabela cresce para sempre com pratos que nunca
 * viraram refeição, e as consultas do dia ficam mais lentas por causa de linhas que ninguém
 * mais vai ver.
 *
 * <p>De hora em hora, e não de minuto em minuto: a validade é de dois dias, então nada aqui é
 * urgente, e um apagamento por hora é barato no banco. O relógio é injetado pelo mesmo motivo
 * do resto do produto: um teste precisa poder se colocar depois do vencimento sem esperar.
 */
@Component
public class CartCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(CartCleanupScheduler.class);

    private final CartRepositoryPort cartRepository;
    private final Clock clock;

    public CartCleanupScheduler(CartRepositoryPort cartRepository, Clock clock) {
        this.cartRepository = cartRepository;
        this.clock = clock;
    }

    @Scheduled(cron = "0 7 * * * *", zone = "${vitalpair.scheduling.zone}")
    @Transactional
    public void removeExpiredCarts() {
        int removidos = cartRepository.deleteExpired(clock.instant());
        // Só registra quando fez alguma coisa: uma linha por hora dizendo "removi zero" é
        // ruído que esconde a linha que importa.
        if (removidos > 0) {
            log.info("Carrinhos expirados removidos: {}", removidos);
        }
    }
}
