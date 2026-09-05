package com.aps.vitalpair.tenant;

import java.util.Optional;
import java.util.UUID;

/**
 * Mantém o {@code tenant_id} da requisição atual em um {@link ThreadLocal}.
 * Populado pelo {@code TenantFilter} (a partir do JWT) e consumido pela camada de persistência
 * para isolar dados entre tenants. O domínio nunca acessa esta classe.
 */
public final class TenantContext {

    private static final ThreadLocal<UUID> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(UUID tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static Optional<UUID> current() {
        return Optional.ofNullable(CURRENT_TENANT.get());
    }

    public static UUID require() {
        UUID tenantId = CURRENT_TENANT.get();
        if (tenantId == null) {
            throw new IllegalStateException("Nenhum tenant no contexto da requisição atual");
        }
        return tenantId;
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
