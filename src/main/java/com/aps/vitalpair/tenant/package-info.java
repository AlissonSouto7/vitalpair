/**
 * Suporte a multi-tenancy (shared database / shared schema).
 *
 * <p>{@link com.aps.vitalpair.tenant.TenantContext} expõe o {@code tenant_id} atual via ThreadLocal;
 * o {@code TenantFilter} (adicionado junto com a camada de auth) extrai o tenant do JWT e popula o
 * contexto. A camada de persistência usa o contexto para isolar dados entre tenants.
 */
package com.aps.vitalpair.tenant;
