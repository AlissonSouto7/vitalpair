package com.aps.vitalpair.ai.infrastructure.client;

import com.aps.vitalpair.ai.domain.exception.PlanGenerationException;
import com.aps.vitalpair.ai.domain.model.WorkoutDay;
import com.aps.vitalpair.ai.domain.model.WorkoutExercise;
import com.aps.vitalpair.ai.domain.port.out.WorkoutPlanGeneratorPort;
import com.aps.vitalpair.user.domain.model.ActivityLevel;
import com.aps.vitalpair.user.domain.model.Goal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Adaptador da porta de geração de plano de treino sobre a Anthropic. O json_schema exige todos
 * os campos em todo objeto (limitação do structured output), então dias de descanso chegam com
 * {@code focus:""}, {@code durationMin:0} e {@code exercises:[]}; a normalização acontece aqui:
 * descanso vira focus/durationMin nulos e lista vazia, e dias ausentes viram descanso.
 */
@Component
public class AnthropicWorkoutPlanGenerator implements WorkoutPlanGeneratorPort {

    private static final Logger log = LoggerFactory.getLogger(AnthropicWorkoutPlanGenerator.class);

    private static final int WEEK_MAX_TOKENS = 8192;

    private static final String SYSTEM_PROMPT =
            "Você é um personal trainer brasileiro montando um plano de treino semanal de academia. "
                    + "Nomes de exercícios em português do Brasil, curtos.";

    private final PlanAiGateway gateway;
    private final ObjectMapper objectMapper;

    public AnthropicWorkoutPlanGenerator(PlanAiGateway gateway, ObjectMapper objectMapper) {
        this.gateway = gateway;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<WorkoutDay> generateWeek(Goal goal, ActivityLevel activityLevel) {
        String json = gateway.generateJson(
                SYSTEM_PROMPT, weekPrompt(goal, activityLevel), weekSchema(), WEEK_MAX_TOKENS);
        return parseWeek(json);
    }

    // ===== Prompt =====

    private static String weekPrompt(Goal goal, ActivityLevel activityLevel) {
        return "Objetivo do usuário: " + describeGoal(goal) + ".\n"
                + "Nível de atividade: " + describeActivityLevel(activityLevel) + ".\n\n"
                + "Monte um plano de 7 dias (dayIndex 0 = segunda-feira ... 6 = domingo), sendo 4 a 5 "
                + "dias de treino e o restante descanso (rest: true). Cada dia de treino tem focus "
                + "(ex: \"Pernas\", \"Peito e tríceps\"), durationMin entre 30 e 60, e de 5 a 7 "
                + "exercícios com name, sets, reps (texto curto como \"12 reps\" ou \"40s\") e "
                + "restSeconds. Para dias de descanso use rest true, focus \"\", durationMin 0 e "
                + "exercises [].";
    }

    private static String describeGoal(Goal goal) {
        return switch (goal) {
            case LOSE_WEIGHT -> "perder peso";
            case GAIN_MUSCLE -> "ganhar músculo";
            case MAINTAIN -> "manter o peso";
            case IMPROVE_FITNESS -> "melhorar o condicionamento físico";
        };
    }

    private static String describeActivityLevel(ActivityLevel level) {
        if (level == null) {
            return "não informado";
        }
        return switch (level) {
            case SEDENTARY -> "sedentário";
            case LIGHT -> "levemente ativo";
            case MODERATE -> "moderadamente ativo";
            case ACTIVE -> "ativo";
            case VERY_ACTIVE -> "muito ativo";
        };
    }

    // ===== Schema (additionalProperties:false e required em todo objeto) =====

    private static Map<String, Object> weekSchema() {
        Map<String, Object> exerciseProperties = new LinkedHashMap<>();
        exerciseProperties.put("name", Map.of("type", "string"));
        exerciseProperties.put("sets", Map.of("type", "integer"));
        exerciseProperties.put("reps", Map.of("type", "string"));
        exerciseProperties.put("restSeconds", Map.of("type", "integer"));
        Map<String, Object> exerciseSchema = Map.of(
                "type", "object",
                "additionalProperties", false,
                "properties", exerciseProperties,
                "required", List.of("name", "sets", "reps", "restSeconds"));

        Map<String, Object> dayProperties = new LinkedHashMap<>();
        dayProperties.put("dayIndex", Map.of("type", "integer"));
        dayProperties.put("rest", Map.of("type", "boolean"));
        dayProperties.put("focus", Map.of("type", "string"));
        dayProperties.put("durationMin", Map.of("type", "integer"));
        dayProperties.put("exercises", Map.of("type", "array", "items", exerciseSchema));
        Map<String, Object> daySchema = Map.of(
                "type", "object",
                "additionalProperties", false,
                "properties", dayProperties,
                "required", List.of("dayIndex", "rest", "focus", "durationMin", "exercises"));

        return Map.of(
                "type", "object",
                "additionalProperties", false,
                "properties", Map.of("days", Map.of("type", "array", "items", daySchema)),
                "required", List.of("days"));
    }

    // ===== Parse + normalização =====

    private List<WorkoutDay> parseWeek(String json) {
        JsonNode root;
        try {
            root = objectMapper.readTree(json);
        } catch (JsonProcessingException ex) {
            log.warn("Resposta da Anthropic fora do formato esperado: {}", ex.getMessage());
            throw new PlanGenerationException("A IA retornou um resultado em formato inesperado.", ex);
        }

        JsonNode days = root.path("days");
        if (!days.isArray() || days.isEmpty()) {
            throw new PlanGenerationException("A IA retornou um plano de treino vazio. Tente gerar de novo.");
        }

        Map<Integer, WorkoutDay> byIndex = new HashMap<>();
        for (JsonNode day : days) {
            int dayIndex = day.path("dayIndex").asInt(-1);
            if (dayIndex < 0 || dayIndex > 6 || byIndex.containsKey(dayIndex)) {
                continue;
            }
            byIndex.put(dayIndex, toDay(day, dayIndex));
        }
        if (byIndex.values().stream().allMatch(WorkoutDay::rest)) {
            throw new PlanGenerationException("A IA retornou uma semana sem nenhum treino. Tente gerar de novo.");
        }

        // Garante os 7 dias: qualquer dia que a IA não devolveu vira descanso.
        List<WorkoutDay> week = new ArrayList<>(7);
        for (int dayIndex = 0; dayIndex <= 6; dayIndex++) {
            week.add(byIndex.getOrDefault(dayIndex, restDay(dayIndex)));
        }
        return week;
    }

    private static WorkoutDay toDay(JsonNode day, int dayIndex) {
        boolean rest = day.path("rest").asBoolean(false);
        List<WorkoutExercise> exercises = new ArrayList<>();
        if (!rest) {
            int position = 0;
            for (JsonNode exercise : day.path("exercises")) {
                String name = exercise.path("name").asText("");
                if (name.isBlank()) {
                    continue;
                }
                exercises.add(new WorkoutExercise(
                        null,
                        position++,
                        name,
                        Math.max(1, exercise.path("sets").asInt(3)),
                        exercise.path("reps").asText("12 reps"),
                        Math.max(0, exercise.path("restSeconds").asInt(60)),
                        false));
            }
        }
        if (rest || exercises.isEmpty()) {
            return restDay(dayIndex);
        }

        String focus = day.path("focus").asText("").trim();
        int durationMin = day.path("durationMin").asInt(0);
        return new WorkoutDay(
                null,
                dayIndex,
                focus.isBlank() ? null : focus,
                durationMin > 0 ? durationMin : null,
                false,
                null,
                exercises);
    }

    private static WorkoutDay restDay(int dayIndex) {
        return new WorkoutDay(null, dayIndex, null, null, true, null, List.of());
    }
}
