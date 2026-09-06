package com.aps.vitalpair.shared.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.auth.domain.port.out.TokenProviderPort;
import com.aps.vitalpair.shared.ratelimit.RateLimiter;

/**
 * Pins the status codes the global handler answers with, using a throwaway controller so
 * the test does not depend on any feature's request shape.
 */
// A nested controller is not picked up by @WebMvcTest's scan on its own; without the
// @Import every request answered 404 and the assertions never reached the handler.
@WebMvcTest(controllers = RestExceptionHandlerTest.ProbeController.class)
@Import(RestExceptionHandlerTest.ProbeController.class)
class RestExceptionHandlerTest {

    @RestController
    static class ProbeController {

        record Body(String name) {}

        @PostMapping("/probe")
        Body echo(@RequestBody Body body) {
            return body;
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TokenProviderPort tokenProvider;

    @MockitoBean
    private RateLimiter rateLimiter;

    /**
     * A body the server cannot parse is the caller's fault. Before the dedicated handler
     * existed this fell through to the generic one and came back as 500, which told the
     * client the server had broken and logged a stack trace for bad input. Found when a
     * Windows shell sent an accented name as invalid UTF-8.
     */
    @Test
    @WithMockUser
    void malformedJsonIsA400NotA500() throws Exception {
        mockMvc.perform(
                        post("/probe")
                                .with(org.springframework.security.test.web.servlet.request
                                        .SecurityMockMvcRequestPostProcessors.csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"name\": \"unterminated"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.status").value(400));
    }

    @Test
    @WithMockUser
    void invalidUtf8IsA400NotA500() throws Exception {
        // 0xC3 0x6C: a two-byte sequence whose second byte is not a continuation byte,
        // which is exactly what a misconfigured shell produces for "é".
        byte[] broken = {'{', '"', 'n', 'a', 'm', 'e', '"', ':', '"', 'C', (byte) 0xC3, 0x6C, '"', '}'};
        mockMvc.perform(
                        post("/probe")
                                .with(org.springframework.security.test.web.servlet.request
                                        .SecurityMockMvcRequestPostProcessors.csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(broken))
                .andExpect(status().isBadRequest());
    }
}
