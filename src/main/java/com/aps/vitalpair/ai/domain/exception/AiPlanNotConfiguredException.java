package com.aps.vitalpair.ai.domain.exception;

import com.aps.vitalpair.shared.exception.DomainException;

/**
 * A integração de IA (Anthropic) não está configurada: a chave de API está em branco.
 * Mapeada para HTTP 503 no {@link com.aps.vitalpair.ai.infrastructure.web.AiPlanExceptionHandler}.
 */
public class AiPlanNotConfiguredException extends DomainException {

    public AiPlanNotConfiguredException(String message) {
        super(message);
    }
}
