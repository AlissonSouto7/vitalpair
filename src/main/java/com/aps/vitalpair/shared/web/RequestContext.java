package com.aps.vitalpair.shared.web;

import org.slf4j.MDC;

/**
 * The identifiers that belong to the request currently being served.
 *
 * <p>They live in SLF4J's MDC, so every log line written while handling a request carries
 * them without any call site passing them along. The request id is also returned to the
 * caller in an error response, which is what turns "it broke" into a report that can be
 * traced: the same string appears in the user's screen and in the server log.
 *
 * <p>MDC is thread-local. Anything that hands work to another thread loses it, which is why
 * the filter clears it in a finally block rather than trusting the request to end cleanly.
 */
public final class RequestContext {

    public static final String REQUEST_ID = "requestId";
    public static final String USER_ID = "userId";
    public static final String TENANT_ID = "tenantId";

    private RequestContext() {}

    /** The current request id, or null outside a request (a scheduled job, for instance). */
    public static String requestId() {
        return MDC.get(REQUEST_ID);
    }

    public static void putRequestId(String requestId) {
        MDC.put(REQUEST_ID, requestId);
    }

    /**
     * Records who is making the request, once the JWT filter has identified them.
     *
     * <p>Ids only. A name or an e-mail in every log line is personal data spread across
     * files that get shipped, archived and read by tooling.
     */
    public static void putCaller(String userId, String tenantId) {
        MDC.put(USER_ID, userId);
        MDC.put(TENANT_ID, tenantId);
    }

    public static void clear() {
        MDC.remove(REQUEST_ID);
        MDC.remove(USER_ID);
        MDC.remove(TENANT_ID);
    }
}
