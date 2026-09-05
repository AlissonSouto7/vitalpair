/**
 * Multi-tenancy support (shared database, shared schema). Each pair is one tenant, and
 * {@code pairs.id} is the tenant id.
 *
 * <p>{@link com.aps.vitalpair.tenant.TenantContext} holds the current tenant id in a
 * ThreadLocal. It is populated by
 * {@link com.aps.vitalpair.auth.infrastructure.security.JwtAuthenticationFilter} from the
 * {@code tenantId} claim and cleared when the request ends.
 *
 * <p><strong>Isolation is not automatic.</strong> No Hibernate filter and no row-level
 * security read this context; the persistence layer does not consult it. Every query that
 * touches tenant-owned data must scope itself explicitly, the way
 * {@code FeedItemJpaRepository} does. Writing a repository method without that filter
 * leaks data across tenants, and nothing will stop you.
 *
 * <p>The reason for keeping it explicit rather than magic: scheduled jobs and event
 * listeners run outside a request, so there is no tenant in the ThreadLocal. An implicit
 * filter would silently return nothing there, which is the kind of bug that surfaces in
 * production. A visible {@code where} clause is auditable.
 */
package com.aps.vitalpair.tenant;
