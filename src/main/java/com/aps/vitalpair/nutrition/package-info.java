/**
 * Feature <b>nutrition</b> — registro de refeições (Open Food Facts ou manual) e resumo nutricional
 * diário (calorias e macros consumidos vs meta).
 *
 * <p><b>Feature de referência</b>: materializa a árvore hexagonal completa para servir de molde às
 * demais. Ver {@code docs/adr/0001-arquitetura-hexagonal.md}.
 * Regra de dependência: infrastructure → application → domain.
 */
package com.aps.vitalpair.nutrition;
