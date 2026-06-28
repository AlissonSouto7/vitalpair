/**
 * Feature <b>mealvision</b> — análise de refeição por foto com IA (Anthropic Claude, visão).
 *
 * <p>O usuário envia uma foto do prato e recebe de volta os alimentos detectados com porção
 * estimada (em gramas) e macros. A operação é <i>stateless</i>: nada é persistido aqui; quem
 * registra a refeição é o endpoint {@code POST /logs} da feature {@code nutrition}.
 *
 * <p>Organização hexagonal (ver {@code docs/adr/0001-arquitetura-hexagonal.md}):
 * {@code domain} (modelo + portas), {@code application} (serviço que orquestra o use case) e
 * {@code infrastructure} ({@code ai} com o cliente Feign da Anthropic e {@code web} com o
 * controller separado do NutritionController). Regra de dependência: infrastructure → application → domain.
 */
package com.aps.vitalpair.mealvision;
