/**
 * The kernel shared by every feature.
 *
 * <p>Holds no domain business rule, only cross-cutting types.
 * <ul>
 *   <li>{@code web}: the {@link com.aps.vitalpair.shared.web.ApiResponse} envelope, paging,
 *       {@link com.aps.vitalpair.shared.web.ApiError} and global error handling.</li>
 *   <li>{@code exception}: the base hierarchy of domain exceptions.</li>
 *   <li>{@code event}: the domain events features publish to each other.</li>
 *   <li>{@code security}, {@code ratelimit}, {@code metrics}: the cross-cutting adapters.</li>
 * </ul>
 */
package com.aps.vitalpair.shared;
