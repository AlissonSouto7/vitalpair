/**
 * Feature <b>ai</b> — geração de planos alimentares e de treino por IA (Anthropic Claude),
 * com recalibração periódica a partir do check-in de peso.
 *
 * <p>Organização hexagonal (ver {@code docs/adr/0001-arquitetura-hexagonal.md}): além de
 * {@code domain} e {@code application}, sua {@code infrastructure} concentra-se no
 * {@code client} de chamada ao LLM. Regra de dependência: infrastructure → application → domain.
 */
package com.aps.vitapair.ai;
