package com.aps.vitalpair.support;

import org.springframework.test.context.DynamicPropertyRegistry;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;

/**
 * One WireMock server for the whole test JVM, standing in for every external HTTP API.
 *
 * <p>Started once and shared, rather than per test class, because the application context
 * is cached across integration tests and its Feign and RestClient beans hold the base URL
 * they were created with. A server per class would leave the cached context pointing at a
 * port that is no longer listening.
 *
 * <p>Each API gets its own path prefix on the same server, so a stub for Anthropic can never
 * be matched by an Open Food Facts call. Stubs are reset before every test by
 * {@link AbstractIntegrationTest}.
 *
 * <p>Response bodies live under {@code src/test/resources/wiremock/__files} and are real
 * responses captured from the APIs, not hand-written approximations. When one of those APIs
 * changes its shape, the fixture is what has to be re-captured.
 */
public final class WireMockSupport {

    public static final String ANTHROPIC_PREFIX = "/anthropic";
    public static final String OFF_PRODUCT_PREFIX = "/off";
    public static final String OFF_SEARCH_PREFIX = "/off-search";

    private static final WireMockServer SERVER =
            new WireMockServer(WireMockConfiguration.options().dynamicPort().usingFilesUnderClasspath("wiremock"));

    static {
        SERVER.start();
        Runtime.getRuntime().addShutdownHook(new Thread(SERVER::stop));
    }

    private WireMockSupport() {}

    public static WireMockServer server() {
        return SERVER;
    }

    /** Points every outbound integration at this server. Called from a @DynamicPropertySource. */
    public static void register(DynamicPropertyRegistry registry) {
        registry.add("vitalpair.ai.anthropic.base-url", () -> SERVER.baseUrl() + ANTHROPIC_PREFIX);
        registry.add("vitalpair.openfoodfacts.base-url", () -> SERVER.baseUrl() + OFF_PRODUCT_PREFIX);
        registry.add("vitalpair.openfoodfacts.search-url", () -> SERVER.baseUrl() + OFF_SEARCH_PREFIX);
    }
}
