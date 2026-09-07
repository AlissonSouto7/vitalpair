package com.aps.vitalpair.tenant;

import java.util.Optional;
import java.util.UUID;

/**
 * Holds the current request's {@code tenant_id} in a {@link ThreadLocal}. Filled by
 * {@code JwtAuthenticationFilter} from the JWT and available to adapters that need the tenant
 * outside a use case argument. The domain never touches this class. Isolation is not
 * automatic: every query still has to scope itself explicitly.
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
