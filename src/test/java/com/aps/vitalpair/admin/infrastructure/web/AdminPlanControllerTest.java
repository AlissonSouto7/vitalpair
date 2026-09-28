package com.aps.vitalpair.admin.infrastructure.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.aps.vitalpair.support.ControllerSliceTest;
import com.aps.vitalpair.support.security.WithVitalPairUser;
import com.aps.vitalpair.user.domain.model.Plan;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.in.GrantPlanUseCase;

/**
 * Quem pode conceder o plano pago, e o que acontece com quem não pode.
 *
 * <p>Este endereço escreve no plano de outra pessoa, então a única coisa entre ele e uma
 * conta comum virando premium sozinha é o papel ADMIN. Um teste que só exercitasse o caminho
 * feliz deixaria essa garantia sem prova.
 */
@WebMvcTest(AdminPlanController.class)
@Import(AdminPlanControllerTest.MethodSecurityForTest.class)
class AdminPlanControllerTest extends ControllerSliceTest {

    /**
     * {@code @EnableMethodSecurity} vive no SecurityConfig, que uma fatia não carrega. Sem
     * religar aqui, o {@code @PreAuthorize} é simplesmente ignorado e todos os testes passam
     * independentemente do papel: exatamente a falsa confiança que eles existem para evitar.
     */
    @TestConfiguration
    @EnableMethodSecurity
    static class MethodSecurityForTest {}

    @MockitoBean
    private GrantPlanUseCase grantPlanUseCase;

    private static User conta(String email, Plan plan, Instant expira) {
        return User.builder()
                .id(UUID.randomUUID())
                .tenantId(UUID.randomUUID())
                .email(email)
                .name("Bel")
                .plan(plan)
                .planExpiresAt(expira)
                .build();
    }

    private String corpo(String email, String plan, String expiresAt) {
        Map<String, Object> m = new HashMap<>();
        m.put("email", email);
        m.put("plan", plan);
        m.put("expiresAt", expiresAt);
        return toJson(m);
    }

    @Test
    @WithVitalPairUser(role = "ADMIN")
    void umAdminConcedeOplanoSemPrazo() throws Exception {
        when(grantPlanUseCase.grantPlan(eq("bel@example.com"), eq(Plan.PREMIUM), eq(null)))
                .thenReturn(conta("bel@example.com", Plan.PREMIUM, null));

        mockMvc.perform(put("/api/v1/admin/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo("bel@example.com", "PREMIUM", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.plan").value("PREMIUM"))
                // Sem prazo é o plano das contas de teste: premium que não vence sozinho no
                // meio de um teste.
                .andExpect(jsonPath("$.data.expiresAt").doesNotExist());
    }

    @Test
    @WithVitalPairUser
    void umaContaComumNaoConsegueVirarPremiumSozinha() throws Exception {
        mockMvc.perform(put("/api/v1/admin/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo("eu@example.com", "PREMIUM", null)))
                .andExpect(status().isForbidden());

        // Não é só o 403: nada chegou ao caso de uso, então nem por engano o plano é escrito.
        verify(grantPlanUseCase, never()).grantPlan(any(), any(), any());
    }

    @Test
    void semSessaoNaoConcedeNada() throws Exception {
        mockMvc.perform(put("/api/v1/admin/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo("eu@example.com", "PREMIUM", null)))
                .andExpect(status().isUnauthorized());

        verify(grantPlanUseCase, never()).grantPlan(any(), any(), any());
    }

    @Test
    @WithVitalPairUser(role = "ADMIN")
    void umPlanoQueJaVenceuEhRecusado() throws Exception {
        String ontem = Instant.now().minus(1, ChronoUnit.DAYS).toString();

        mockMvc.perform(put("/api/v1/admin/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo("bel@example.com", "PREMIUM", ontem)))
                .andExpect(status().isBadRequest());

        // Conceder algo já vencido não é um pedido, é erro de digitação.
        verify(grantPlanUseCase, never()).grantPlan(any(), any(), any());
    }

    @Test
    @WithVitalPairUser(role = "ADMIN")
    void umEmailMalFormadoEhRecusado() throws Exception {
        mockMvc.perform(put("/api/v1/admin/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo("nao-e-email", "PREMIUM", null)))
                .andExpect(status().isBadRequest());

        verify(grantPlanUseCase, never()).grantPlan(any(), any(), any());
    }

    @Test
    @WithVitalPairUser(role = "ADMIN")
    void retirarOplanoDevolveAcontaComoFree() throws Exception {
        when(grantPlanUseCase.grantPlan(eq("bel@example.com"), eq(Plan.FREE), eq(null)))
                .thenReturn(conta("bel@example.com", Plan.FREE, null));

        mockMvc.perform(put("/api/v1/admin/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo("bel@example.com", "FREE", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.plan").value("FREE"));
    }

    @Test
    @WithVitalPairUser(role = "ADMIN")
    void aRespostaNaoCarregaOperfilDaPessoa() throws Exception {
        when(grantPlanUseCase.grantPlan(any(), any(), any())).thenReturn(conta("bel@example.com", Plan.PREMIUM, null));

        mockMvc.perform(put("/api/v1/admin/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo("bel@example.com", "PREMIUM", null)))
                .andExpect(status().isOk())
                // Um endereço de administração que devolvesse o perfil daria a um ADMIN uma
                // forma de ler dado de qualquer conta passando por uma operação de escrita.
                .andExpect(jsonPath("$.data.name").doesNotExist())
                .andExpect(jsonPath("$.data.weightKg").doesNotExist())
                .andExpect(jsonPath("$.data.birthDate").doesNotExist());
    }
}
