package com.aps.vitalpair.gamification.infrastructure.web;

import com.aps.vitalpair.gamification.domain.model.Level;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * O nível de quem perguntou.
 *
 * @param level de 1 a 99
 * @param points quanto somou na vida, do primeiro registro até agora
 * @param pointsToNext quanto falta para subir, que é o número que faz registrar mais uma coisa
 * @param percent quanto do nível atual já foi andado, para a barra
 */
public record LevelResponse(
        @Schema(example = "3") int level,
        @Schema(example = "470") long points,
        @Schema(example = "330") long pointsToNext,
        @Schema(example = "64") int percent) {

    public static LevelResponse from(Level level) {
        return new LevelResponse(level.level(), level.points(), level.pointsToNext(), level.percent());
    }
}
