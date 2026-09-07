package com.aps.vitalpair.shared.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.support.ControllerSliceTest;
import com.aps.vitalpair.support.security.WithVitalPairUser;

/**
 * Pins the status codes the global handler answers with, using a throwaway controller so
 * the test does not depend on any feature's request shape.
 */
// A nested controller is not picked up by @WebMvcTest's scan on its own; without the
// @Import every request answered 404 and the assertions never reached the handler.
@WebMvcTest(controllers = RestExceptionHandlerTest.ProbeController.class)
@Import(RestExceptionHandlerTest.ProbeController.class)
class RestExceptionHandlerTest extends ControllerSliceTest {

    @RestController
    static class ProbeController {

        enum Colour {
            RED,
            GREEN
        }

        record Body(String name) {}

        record TypedBody(String name, Colour colour, Integer size) {}

        @PostMapping("/probe")
        Body echo(@RequestBody Body body) {
            return body;
        }

        @PostMapping("/probe-typed")
        TypedBody echoTyped(@RequestBody TypedBody body) {
            return body;
        }
    }

    /**
     * A body the server cannot parse is the caller's fault. Before the dedicated handler
     * existed this fell through to the generic one and came back as 500, which told the
     * client the server had broken and logged a stack trace for bad input. Found when a
     * Windows shell sent an accented name as invalid UTF-8.
     */
    @Test
    @WithVitalPairUser
    void malformedJsonIsA400NotA500() throws Exception {
        mockMvc.perform(post("/probe").contentType(MediaType.APPLICATION_JSON).content("{\"name\": \"unterminated"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.status").value(400));
    }

    @Test
    @WithVitalPairUser
    void invalidUtf8IsA400NotA500() throws Exception {
        // 0xC3 0x6C: a two-byte sequence whose second byte is not a continuation byte,
        // which is exactly what a misconfigured shell produces for "é".
        byte[] broken = {'{', '"', 'n', 'a', 'm', 'e', '"', ':', '"', 'C', (byte) 0xC3, 0x6C, '"', '}'};
        mockMvc.perform(post("/probe").contentType(MediaType.APPLICATION_JSON).content(broken))
                .andExpect(status().isBadRequest());
    }

    /**
     * A wrong enum value used to answer "corpo inválido" with an empty violations list, so
     * the caller learnt only that something somewhere was wrong. The exception already knows
     * which field it was and what the field accepts.
     */
    @Test
    @WithVitalPairUser
    void aWrongEnumValueNamesTheFieldAndItsAcceptedValues() throws Exception {
        mockMvc.perform(post("/probe-typed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"x\",\"colour\":\"PURPLE\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.violations[0].field").value("colour"))
                .andExpect(jsonPath("$.data.violations[0].message").value(org.hamcrest.Matchers.containsString("RED")))
                .andExpect(
                        jsonPath("$.data.violations[0].message").value(org.hamcrest.Matchers.containsString("GREEN")));
    }

    @Test
    @WithVitalPairUser
    void aWrongTypeAlsoNamesTheField() throws Exception {
        mockMvc.perform(post("/probe-typed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"x\",\"size\":\"not a number\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.violations[0].field").value("size"));
    }

    /** A body that is not JSON at all has no field to blame, and must not invent one. */
    @Test
    @WithVitalPairUser
    void anUnparseableBodyStillHasNoViolations() throws Exception {
        mockMvc.perform(post("/probe").contentType(MediaType.APPLICATION_JSON).content("{\"name\": \"unterminated"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.violations").isEmpty());
    }
}
