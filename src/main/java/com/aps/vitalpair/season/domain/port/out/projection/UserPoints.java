package com.aps.vitalpair.season.domain.port.out.projection;

import java.util.UUID;

/** Total de pontos de um usuário na janela consultada. */
public record UserPoints(UUID userId, long points) {}
