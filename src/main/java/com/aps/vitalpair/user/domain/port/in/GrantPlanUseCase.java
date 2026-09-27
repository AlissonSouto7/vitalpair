package com.aps.vitalpair.user.domain.port.in;

import java.time.Instant;

import com.aps.vitalpair.user.domain.model.Plan;
import com.aps.vitalpair.user.domain.model.User;

/**
 * Concede ou retira o plano pago de uma conta, por decisão administrativa.
 *
 * <p>Existe porque hoje não há cobrança: as contas de teste viravam PREMIUM por um UPDATE
 * escrito à mão no banco, o que exige SSH no servidor, não deixa rastro de quem fez, e
 * precisa ser repetido a cada conta nova. Um endereço com o papel ADMIN faz a mesma coisa
 * de qualquer lugar e fica no log.
 *
 * <p>Não é o caminho da assinatura. Quando a cobrança existir, quem escreve o plano é o
 * webhook do provedor de pagamento, a partir de um pagamento confirmado; este continua
 * sendo o caminho administrativo, para cortesia, suporte e teste.
 */
public interface GrantPlanUseCase {

    /**
     * Grava o plano na conta identificada pelo e-mail.
     *
     * <p>Pelo e-mail e não pelo id: quem vai usar isto digita o e-mail de quem está pedindo
     * acesso, e obrigar a descobrir o UUID antes seria trocar um passo manual por dois.
     *
     * @param email de quem recebe. Normalizado como o cadastro normaliza.
     * @param plan FREE tira o acesso, PREMIUM concede
     * @param expiresAt quando o plano acaba, ou null para um plano sem prazo. Ignorado
     *     quando o plano é FREE, porque uma data de fim para "não tem plano" não significa
     *     nada.
     * @return a conta como ficou
     */
    User grantPlan(String email, Plan plan, Instant expiresAt);
}
