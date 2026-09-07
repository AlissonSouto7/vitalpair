package com.aps.vitalpair.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

/**
 * The OpenAPI document: what the API is, how to authenticate, and where it lives.
 *
 * <p>Disabled entirely in production (see application-prod.yaml): an interactive browser of
 * every endpoint and payload shape is useful while developing and an invitation once the
 * application is public.
 */
@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Value("${vitalpair.app.frontend-url:http://localhost:5173}")
    private String publicUrl;

    @Bean
    OpenAPI vitalPairOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("VitalPair API")
                        .version("v1")
                        .description(
                                """
                                Health and fitness for pairs: two people with opposite goals log meals \
                                and workouts, score points and compete across seasons.

                                **Every response uses the same envelope.** `{ "success": boolean, \
                                "message": string｜null, "data": T｜null }`. On a failure `data` \
                                carries the error detail, including `requestId`: the same id appears \
                                in the server log, so quoting it in a report finds the exact request.

                                **Authentication.** `POST /api/v1/auth/login` returns an access token \
                                to send as `Authorization: Bearer <token>`. It expires in fifteen \
                                minutes. The refresh token is never in the body: it is set as an \
                                HttpOnly cookie that page scripts cannot read, and `POST \
                                /api/v1/auth/refresh` exchanges it for a new pair. A refresh token is \
                                single-use, and replaying a spent one revokes the whole session \
                                family, on the assumption that a replay means it was stolen.

                                **Rate limits.** Authentication and the AI endpoints are capped; \
                                exceeding one returns 429 with a `Retry-After` header.

                                **Language.** Messages meant for the end user are in Brazilian \
                                Portuguese, which is the product's language.""")
                        .contact(new Contact().name("VitalPair").email("contact@vitalpair.app"))
                        .license(new License()
                                .name("BUSL-1.1")
                                .url("https://github.com/AlissonSouto7/vitalpair/blob/main/LICENSE")))
                .servers(List.of(
                        new Server().url(publicUrl).description("This deployment"),
                        new Server().url("http://localhost:8081").description("Local development")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))
                .components(
                        new Components()
                                .addSecuritySchemes(
                                        BEARER_SCHEME,
                                        new SecurityScheme()
                                                .name(BEARER_SCHEME)
                                                .type(SecurityScheme.Type.HTTP)
                                                .scheme("bearer")
                                                .bearerFormat("JWT")
                                                .description(
                                                        "The access token from /api/v1/auth/login, valid for fifteen minutes.")));
    }
}
