package com.aps.vitalpair.user.application.service;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.Plan;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.in.GrantPlanUseCase;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/** Concede ou retira o plano pago. Ver {@link GrantPlanUseCase} para o porquê. */
@Service
public class GrantPlanService implements GrantPlanUseCase {

    private static final Logger log = LoggerFactory.getLogger(GrantPlanService.class);

    private final UserRepositoryPort userRepository;

    public GrantPlanService(UserRepositoryPort userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public User grantPlan(String email, Plan plan, Instant expiresAt) {
        // O e-mail é comparado como foi gravado, porque a coluna é UNIQUE sobre o texto cru e
        // nada no cadastro normaliza. Só o espaço em volta sai, que é erro de digitação e não
        // parte do endereço.
        String procurado = email == null ? "" : email.trim();
        User user = userRepository
                .findByEmail(procurado)
                .orElseThrow(() -> ResourceNotFoundException.of("Usuário", procurado));

        // Uma data de fim para FREE não significa nada, e guardá-la deixaria a linha dizendo
        // que um plano que não existe expira em alguma data.
        Instant fim = plan == Plan.PREMIUM ? expiresAt : null;

        User salvo = userRepository.save(
                user.toBuilder().plan(plan).planExpiresAt(fim).build());

        /*
         * Registrado porque é uma concessão administrativa, não uma compra: quando a cobrança
         * existir, o rastro é o pagamento, e até lá é esta linha que responde "por que esta
         * conta é premium?". O e-mail entra no log por ser o identificador pedido pela pessoa;
         * nada mais da conta é registrado.
         */
        log.info("Plano alterado por administração: {} agora é {} (expira em {})", procurado, plan, fim);
        return salvo;
    }
}
