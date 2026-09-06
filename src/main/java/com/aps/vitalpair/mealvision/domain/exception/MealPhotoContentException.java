package com.aps.vitalpair.mealvision.domain.exception;

/**
 * A IA respondeu, mas a resposta não serve: recusa do modelo, resposta vazia ou fora do
 * formato esperado.
 *
 * <p>Separada de {@link MealPhotoAnalysisException} pelo mesmo motivo do plano por IA: o
 * disjuntor só deve contar falhas que indicam parceiro fora do ar. Uma foto que o modelo se
 * recusa a analisar é uma resposta, e não pode derrubar a análise para todo mundo.
 *
 * <p>Continua mapeada para HTTP 502.
 */
public class MealPhotoContentException extends MealPhotoAnalysisException {

    public MealPhotoContentException(String message) {
        super(message);
    }

    public MealPhotoContentException(String message, Throwable cause) {
        super(message, cause);
    }
}
