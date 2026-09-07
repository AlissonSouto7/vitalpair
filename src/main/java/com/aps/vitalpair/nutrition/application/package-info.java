/**
 * Application layer of nutrition: implements the inbound ports and orchestrates the outbound
 * ones. Depends on {@code domain} only.
 *
 * <ul>
 *   <li>{@code service}: the use case implementations ({@code @Service}, {@code @Transactional}).</li>
 *   <li>{@code dto}: commands, queries and results independent of HTTP.</li>
 * </ul>
 */
package com.aps.vitalpair.nutrition.application;
