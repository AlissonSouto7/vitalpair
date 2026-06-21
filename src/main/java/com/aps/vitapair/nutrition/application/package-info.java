/**
 * Camada de aplicação de nutrition: implementa as portas de entrada e orquestra as de saída.
 * Depende apenas de {@code domain}.
 *
 * <ul>
 *   <li>{@code service} — implementações dos casos de uso ({@code @Service}, {@code @Transactional}).</li>
 *   <li>{@code dto} — commands/queries/results independentes do HTTP.</li>
 * </ul>
 */
package com.aps.vitapair.nutrition.application;
