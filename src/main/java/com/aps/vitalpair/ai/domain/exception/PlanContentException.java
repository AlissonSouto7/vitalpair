package com.aps.vitalpair.ai.domain.exception;

/**
 * A IA respondeu, mas a resposta não serve: recusa do modelo, resposta vazia ou fora do
 * formato esperado.
 *
 * <p>Distinta de {@link PlanGenerationException} por causa do disjuntor. Erro de rede, timeout
 * e 5xx indicam parceiro fora do ar e devem contar para abrir o circuito; recusa e resposta
 * malformada são respostas normais a um pedido específico. Sem essa separação, alguns prompts
 * incomuns derrubariam a geração de planos para todo mundo por um minuto.
 *
 * <p>Continua mapeada para HTTP 502, porque do ponto de vista de quem chamou o resultado é o
 * mesmo: o plano não veio.
 */
public class PlanContentException extends PlanGenerationException {

    public PlanContentException(String message) {
        super(message);
    }

    public PlanContentException(String message, Throwable cause) {
        super(message, cause);
    }
}
