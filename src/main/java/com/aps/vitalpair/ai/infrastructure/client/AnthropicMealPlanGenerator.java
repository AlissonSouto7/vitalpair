package com.aps.vitalpair.ai.infrastructure.client;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.aps.vitalpair.ai.domain.exception.PlanGenerationException;
import com.aps.vitalpair.ai.domain.model.MealPlanItem;
import com.aps.vitalpair.ai.domain.model.NutritionTargets;
import com.aps.vitalpair.ai.domain.model.PlanMealType;
import com.aps.vitalpair.ai.domain.port.out.MealPlanGeneratorPort;
import com.aps.vitalpair.user.domain.model.Goal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Adaptador da porta de geração de cardápio sobre a Anthropic. Monta o prompt com as metas do
 * usuário, força a saída estruturada (json_schema) e converte a resposta em itens do plano
 * (com deduplicação por dia/refeição; a IA nunca é confiada às cegas).
 */
@Component
public class AnthropicMealPlanGenerator implements MealPlanGeneratorPort {

    private static final Logger log = LoggerFactory.getLogger(AnthropicMealPlanGenerator.class);

    private static final int WEEK_MAX_TOKENS = 8192;
    private static final int SWAP_MAX_TOKENS = 1024;

    private static final String SYSTEM_PROMPT =
            "Você é um nutricionista brasileiro montando um cardápio semanal realista, com comida do "
                    + "dia a dia do Brasil (arroz, feijão, frango, ovo, tapioca, frutas). Pratos simples "
                    + "de preparar, nomes curtos em português do Brasil.";

    private final PlanAiGateway gateway;
    private final ObjectMapper objectMapper;

    public AnthropicMealPlanGenerator(PlanAiGateway gateway, ObjectMapper objectMapper) {
        this.gateway = gateway;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<MealPlanItem> generateWeek(NutritionTargets targets) {
        String json = gateway.generateJson(SYSTEM_PROMPT, weekPrompt(targets), weekSchema(), WEEK_MAX_TOKENS);
        return parseWeek(json);
    }

    @Override
    public MealPlanItem generateAlternative(MealPlanItem current) {
        String json = gateway.generateJson(SYSTEM_PROMPT, swapPrompt(current), mealSchema(), SWAP_MAX_TOKENS);
        return parseAlternative(json, current);
    }

    // ===== Prompts =====

    private static String weekPrompt(NutritionTargets targets) {
        StringBuilder prompt = new StringBuilder("Metas diárias do usuário:\n");
        prompt.append("- Calorias: ").append(targets.dailyKcal()).append(" kcal\n");
        if (targets.proteinG() != null) {
            prompt.append("- Proteína: ").append(targets.proteinG()).append(" g\n");
        }
        if (targets.carbG() != null) {
            prompt.append("- Carboidrato: ").append(targets.carbG()).append(" g\n");
        }
        if (targets.fatG() != null) {
            prompt.append("- Gordura: ").append(targets.fatG()).append(" g\n");
        }
        if (targets.goal() != null) {
            prompt.append("- Objetivo: ").append(describeGoal(targets.goal())).append('\n');
        }
        prompt.append('\n')
                .append("Monte o cardápio de 7 dias (dayIndex 0 = segunda-feira ... 6 = domingo), cada dia ")
                .append("com exatamente 4 refeições: BREAKFAST (café da manhã), LUNCH (almoço), SNACK (lanche) ")
                .append("e DINNER (janta). Cada refeição tem name (nome curto do prato), kcal, proteinG, carbG ")
                .append("e fatG, todos números inteiros. O TOTAL de kcal de cada dia deve ficar a no máximo ")
                .append("5% da meta de calorias (para mais ou para menos). VARIE os pratos entre os dias.");
        return prompt.toString();
    }

    private static String swapPrompt(MealPlanItem current) {
        return "No cardápio da semana, a refeição " + current.mealType().name()
                + " atual é \"" + current.name() + "\", com " + current.kcal() + " kcal, "
                + current.proteinG() + " g de proteína, " + current.carbG() + " g de carboidrato e "
                + current.fatG() + " g de gordura.\n\n"
                + "Sugira UMA refeição alternativa com um prato DIFERENTE desse, mantendo kcal e macros "
                + "na mesma faixa (até 10% de diferença). Responda name (nome curto do prato), kcal, "
                + "proteinG, carbG e fatG, todos números inteiros.";
    }

    private static String describeGoal(Goal goal) {
        return switch (goal) {
            case LOSE_WEIGHT -> "perder peso";
            case GAIN_MUSCLE -> "ganhar músculo";
            case MAINTAIN -> "manter o peso";
            case IMPROVE_FITNESS -> "melhorar o condicionamento físico";
        };
    }

    // ===== Schemas (json_schema com additionalProperties:false e required em todo objeto) =====

    private static Map<String, Object> mealSchema() {
        Map<String, Object> number = Map.of("type", "number");
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("mealType", Map.of("type", "string", "enum", List.of("BREAKFAST", "LUNCH", "SNACK", "DINNER")));
        properties.put("name", Map.of("type", "string"));
        properties.put("kcal", number);
        properties.put("proteinG", number);
        properties.put("carbG", number);
        properties.put("fatG", number);
        return Map.of(
                "type",
                "object",
                "additionalProperties",
                false,
                "properties",
                properties,
                "required",
                List.of("mealType", "name", "kcal", "proteinG", "carbG", "fatG"));
    }

    private static Map<String, Object> weekSchema() {
        Map<String, Object> dayProperties = new LinkedHashMap<>();
        dayProperties.put("dayIndex", Map.of("type", "integer"));
        dayProperties.put("meals", Map.of("type", "array", "items", mealSchema()));
        Map<String, Object> daySchema = Map.of(
                "type",
                "object",
                "additionalProperties",
                false,
                "properties",
                dayProperties,
                "required",
                List.of("dayIndex", "meals"));
        return Map.of(
                "type",
                "object",
                "additionalProperties",
                false,
                "properties",
                Map.of("days", Map.of("type", "array", "items", daySchema)),
                "required",
                List.of("days"));
    }

    // ===== Parse =====

    private List<MealPlanItem> parseWeek(String json) {
        JsonNode root = readTree(json);
        JsonNode days = root.path("days");
        if (!days.isArray() || days.isEmpty()) {
            throw new PlanGenerationException("A IA retornou um cardápio vazio. Tente gerar de novo.");
        }
        List<MealPlanItem> items = new ArrayList<>();
        Set<String> slots = new HashSet<>();
        for (JsonNode day : days) {
            int dayIndex = day.path("dayIndex").asInt(-1);
            if (dayIndex < 0 || dayIndex > 6) {
                continue;
            }
            for (JsonNode meal : day.path("meals")) {
                PlanMealType mealType = mealType(meal.path("mealType").asText(""));
                if (mealType == null || !slots.add(dayIndex + ":" + mealType)) {
                    continue;
                }
                items.add(new MealPlanItem(
                        null,
                        dayIndex,
                        mealType,
                        meal.path("name").asText("Refeição"),
                        meal.path("kcal").asInt(0),
                        meal.path("proteinG").asInt(0),
                        meal.path("carbG").asInt(0),
                        meal.path("fatG").asInt(0)));
            }
        }
        if (items.isEmpty()) {
            throw new PlanGenerationException("A IA retornou um cardápio vazio. Tente gerar de novo.");
        }
        return items;
    }

    private MealPlanItem parseAlternative(String json, MealPlanItem current) {
        JsonNode meal = readTree(json);
        String name = meal.path("name").asText("");
        if (name.isBlank()) {
            throw new PlanGenerationException("A IA não retornou a refeição alternativa. Tente de novo.");
        }
        return new MealPlanItem(
                current.id(),
                current.dayIndex(),
                current.mealType(),
                name,
                meal.path("kcal").asInt(current.kcal()),
                meal.path("proteinG").asInt(current.proteinG()),
                meal.path("carbG").asInt(current.carbG()),
                meal.path("fatG").asInt(current.fatG()));
    }

    private JsonNode readTree(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (JsonProcessingException ex) {
            log.warn("Resposta da Anthropic fora do formato esperado: {}", ex.getMessage());
            throw new PlanGenerationException("A IA retornou um resultado em formato inesperado.", ex);
        }
    }

    private static PlanMealType mealType(String raw) {
        try {
            return PlanMealType.valueOf(raw);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
