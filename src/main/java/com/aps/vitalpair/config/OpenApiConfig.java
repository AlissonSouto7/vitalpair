package com.aps.vitalpair.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuração do Swagger/OpenAPI. Define o esquema de segurança Bearer (JWT) para que o botão
 * "Authorize" do Swagger UI permita testar os endpoints protegidos com um access token.
 */
@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    OpenAPI vitalPairOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("VitalPair API")
                        .description("API do VitalPair — app de saúde e fitness para casais.")
                        .version("v1")
                        .contact(new Contact().name("VitalPair").email("contact@vitalpair.app")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))
                .components(new Components().addSecuritySchemes(BEARER_SCHEME, new SecurityScheme()
                        .name(BEARER_SCHEME)
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")));
    }
}
