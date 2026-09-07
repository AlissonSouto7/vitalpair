package com.aps.vitalpair.mealvision.infrastructure.ai;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.aps.vitalpair.config.AnthropicProperties;
import com.aps.vitalpair.mealvision.domain.exception.AiNotConfiguredException;
import com.aps.vitalpair.mealvision.domain.exception.MealPhotoAnalysisException;
import com.aps.vitalpair.mealvision.domain.exception.MealPhotoContentException;
import com.aps.vitalpair.mealvision.domain.model.DetectedFood;
import com.aps.vitalpair.mealvision.domain.model.MealPhotoAnalysis;
import com.aps.vitalpair.mealvision.domain.port.out.MealPhotoAnalyzerPort;
import com.aps.vitalpair.shared.metrics.AiMetrics;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;

/**
 * Adapter of the photo analysis port over the Anthropic Messages API (Claude vision). Builds
 * the body with structured output (json_schema), calls the {@link AnthropicClient} and turns
 * the response's text block (JSON) into the domain model. Stateless: nothing is persisted.
 */
@Component
public class AnthropicMealPhotoAnalyzer implements MealPhotoAnalyzerPort {

    private static final Logger log = LoggerFactory.getLogger(AnthropicMealPhotoAnalyzer.class);

    private static final int MAX_TOKENS = 1024;
    private static final String SYSTEM_PROMPT =
            "Você é um nutricionista assistente. Identifica os alimentos numa foto de prato e estima "
                    + "porção (em gramas) e macros. Responda os nomes dos alimentos em português do Brasil, curtos.";
    private static final String USER_PROMPT =
            "Liste cada alimento visível com a porção estimada em gramas e os macros (calorias kcal, "
                    + "proteína g, carboidrato g, gordura g) DAQUELA porção. Se não houver comida, retorne items vazio.";

    private final AnthropicClient client;
    private final AnthropicProperties properties;
    private final ObjectMapper objectMapper;
    private final AiMetrics metrics;

    public AnthropicMealPhotoAnalyzer(
            AnthropicClient client, AnthropicProperties properties, ObjectMapper objectMapper, AiMetrics metrics) {
        this.client = client;
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.metrics = metrics;
    }

    /**
     * Analyses the photo. Shares the {@code anthropic} circuit breaker with plan generation because
     * it is the same partner: if it is down, there is no point in each feature finding that out
     * separately by waiting out its own timeout.
     */
    @Override
    @CircuitBreaker(name = "anthropic", fallbackMethod = "unavailable")
    public MealPhotoAnalysis analyze(String imageBase64, String mediaType) {
        if (!properties.isConfigured()) {
            throw new AiNotConfiguredException(
                    "A análise por foto ainda não está ligada. Configure a chave da IA no servidor.");
        }

        AnthropicMessages.Response response;
        try {
            response = metrics.timed("meal-photo", () -> client.createMessage(buildRequest(imageBase64, mediaType)));
        } catch (AiNotConfiguredException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            log.warn("Falha ao chamar a Anthropic para análise de foto: {}", ex.getMessage(), ex);
            throw new MealPhotoAnalysisException(
                    "Não foi possível analisar a foto agora. Tente novamente em instantes.", ex);
        }

        if (response == null) {
            throw new MealPhotoContentException("A IA não retornou nenhuma resposta.");
        }
        if ("refusal".equals(response.stopReason())) {
            throw new MealPhotoContentException("A IA não conseguiu analisar esta foto. Tente outra imagem do prato.");
        }

        String json = extractTextBlock(response);
        return parse(json);
    }

    /** See {@code PlanAiGateway.unavailable}: domain exceptions pass through untouched. */
    @SuppressWarnings("unused")
    private MealPhotoAnalysis unavailable(String imageBase64, String mediaType, Throwable cause) {
        if (cause instanceof AiNotConfiguredException notConfigured) {
            throw notConfigured;
        }
        if (cause instanceof MealPhotoAnalysisException analysisFailure) {
            throw analysisFailure;
        }
        log.warn("Anthropic circuit is open, refusing photo analysis without calling");
        throw new MealPhotoAnalysisException(
                "A análise por foto está indisponível no momento. Tente em alguns minutos.");
    }

    private AnthropicMessages.Request buildRequest(String imageBase64, String mediaType) {
        AnthropicMessages.Message userMessage = new AnthropicMessages.Message(
                "user",
                List.of(
                        AnthropicMessages.Content.image(mediaType, imageBase64),
                        AnthropicMessages.Content.text(USER_PROMPT)));

        AnthropicMessages.OutputConfig outputConfig =
                new AnthropicMessages.OutputConfig(AnthropicMessages.Format.jsonSchema(responseSchema()));

        return new AnthropicMessages.Request(
                properties.model(), MAX_TOKENS, SYSTEM_PROMPT, List.of(userMessage), outputConfig);
    }

    /** The json_schema that forces the output into the shape the frontend expects. */
    private static Map<String, Object> responseSchema() {
        Map<String, Object> numberType = Map.of("type", "number");
        Map<String, Object> itemProperties = new java.util.LinkedHashMap<>();
        itemProperties.put("foodName", Map.of("type", "string"));
        itemProperties.put("quantityG", numberType);
        itemProperties.put("caloriesKcal", numberType);
        itemProperties.put("proteinG", numberType);
        itemProperties.put("carbG", numberType);
        itemProperties.put("fatG", numberType);

        Map<String, Object> itemSchema = Map.of(
                "type",
                "object",
                "additionalProperties",
                false,
                "properties",
                itemProperties,
                "required",
                List.of("foodName", "quantityG", "caloriesKcal", "proteinG", "carbG", "fatG"));

        Map<String, Object> itemsSchema = Map.of("type", "array", "items", itemSchema);

        return Map.of(
                "type",
                "object",
                "additionalProperties",
                false,
                "properties",
                Map.of("items", itemsSchema),
                "required",
                List.of("items"));
    }

    private static String extractTextBlock(AnthropicMessages.Response response) {
        if (response.content() == null) {
            throw new MealPhotoContentException("A IA retornou uma resposta vazia.");
        }
        return response.content().stream()
                .filter(block -> "text".equals(block.type())
                        && block.text() != null
                        && !block.text().isBlank())
                .map(AnthropicMessages.Block::text)
                .findFirst()
                .orElseThrow(() -> new MealPhotoContentException("A IA não retornou os alimentos detectados."));
    }

    private MealPhotoAnalysis parse(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode items = root.path("items");
            if (!items.isArray() || items.isEmpty()) {
                return MealPhotoAnalysis.empty();
            }
            List<DetectedFood> foods = new ArrayList<>();
            for (JsonNode item : items) {
                foods.add(new DetectedFood(
                        item.path("foodName").asText(""),
                        decimal(item, "quantityG"),
                        decimal(item, "caloriesKcal"),
                        decimal(item, "proteinG"),
                        decimal(item, "carbG"),
                        decimal(item, "fatG")));
            }
            return new MealPhotoAnalysis(foods);
        } catch (JsonProcessingException ex) {
            log.warn("Resposta da Anthropic fora do formato esperado: {}", ex.getMessage(), ex);
            throw new MealPhotoContentException("A IA retornou um resultado em formato inesperado.", ex);
        }
    }

    private static BigDecimal decimal(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isNumber() ? value.decimalValue() : BigDecimal.ZERO;
    }
}
