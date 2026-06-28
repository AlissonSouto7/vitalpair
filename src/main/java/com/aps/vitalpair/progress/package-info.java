/**
 * Feature <b>progress</b> — tela de Progresso: histórico de peso ({@code weight_logs}),
 * calorias consumidas vs meta nos últimos 7 dias e médias de macros nos últimos 7 dias.
 *
 * <p>Peso é persistido aqui (um registro por dia, upsert). Calorias e macros são agregados
 * read-only de {@code food_logs} (feature nutrition); as metas vêm do perfil (feature user/tdee).
 * Regra de dependência: infrastructure → application → domain.
 */
package com.aps.vitalpair.progress;
