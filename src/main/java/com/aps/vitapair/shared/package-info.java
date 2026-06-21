/**
 * Kernel compartilhado entre todas as features.
 *
 * <p>Não contém regra de negócio de domínio: apenas tipos transversais.
 * <ul>
 *   <li>{@code web} — envelope {@link com.aps.vitapair.shared.web.ApiResponse}, paginação,
 *       {@link com.aps.vitapair.shared.web.ApiError} e o tratamento global de erros.</li>
 *   <li>{@code exception} — hierarquia base de exceções de domínio.</li>
 * </ul>
 */
package com.aps.vitapair.shared;
