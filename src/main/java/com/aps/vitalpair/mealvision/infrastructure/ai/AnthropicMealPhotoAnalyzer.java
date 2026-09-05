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
import com.aps.vitalpair.mealvision.domain.model.DetectedFood;
import com.aps.vitalpair.mealvision.domain.model.MealPhotoAnalysis;
import com.aps.vitalpair.mealvision.domain.port.out.MealPhotoAnalyzerPort;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Adaptador da porta de análise de foto sobre a API de Mensagens da Anthropic (Claude visão).
 * Monta o corpo com saída estruturada (json_schema), chama o {@link AnthropicClient} e converte
 * o bloco de texto (JSON) da resposta no modelo de domínio. Stateless: nada é persistido.
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

    public AnthropicMealPhotoAnalyzer(
            AnthropicClient client, AnthropicProperties properties, ObjectMapper objectMapper) {
        this.client = client;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    public MealPhotoAnalysis analyze(String imageBase64, String mediaType) {
        if (!properties.isConfigured()) {
            throw new AiNotConfiguredException(
                    "A análise por foto ainda não está ligada. Configure a chave da IA no servidor.");
        }

        AnthropicMessages.Response response;
        try {
            response = client.createMessage(buildRequest(imageBase64, mediaType));
        } catch (AiNotConfiguredException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            log.warn("Falha ao chamar a Anthropic para análise de foto: {}", ex.getMessage());
            throw new MealPhotoAnalysisException(
                    "Não foi possível analisar a foto agora. Tente novamente em instantes.", ex);
        }

        if (response == null) {
            throw new MealPhotoAnalysisException("A IA não retornou nenhuma resposta.");
        }
        if ("refusal".equals(response.stopReason())) {
            throw new MealPhotoAnalysisException("A IA não conseguiu analisar esta foto. Tente outra imagem do prato.");
        }

        String json = extractTextBlock(response);
        return parse(json);
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

    /** Schema json_schema que força a saída no formato esperado pelo frontend. */
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
            throw new MealPhotoAnalysisException("A IA retornou uma resposta vazia.");
        }
        return response.content().stream()
                .filter(block -> "text".equals(block.type())
                        && block.text() != null
                        && !block.text().isBlank())
                .map(AnthropicMessages.Block::text)
                .findFirst()
                .orElseThrow(() -> new MealPhotoAnalysisException("A IA não retornou os alimentos detectados."));
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
            log.warn("Resposta da Anthropic fora do formato esperado: {}", ex.getMessage());
            throw new MealPhotoAnalysisException("A IA retornou um resultado em formato inesperado.", ex);
        }
    }

    private static BigDecimal decimal(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isNumber() ? value.decimalValue() : BigDecimal.ZERO;
    }
}
