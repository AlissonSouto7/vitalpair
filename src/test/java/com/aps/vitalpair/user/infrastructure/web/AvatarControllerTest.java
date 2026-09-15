package com.aps.vitalpair.user.infrastructure.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.aps.vitalpair.shared.image.ImageSanitizer;
import com.aps.vitalpair.shared.image.InvalidImageException;
import com.aps.vitalpair.support.ControllerSliceTest;
import com.aps.vitalpair.support.security.WithVitalPairUser;
import com.aps.vitalpair.user.domain.port.in.ReadAvatarUseCase;
import com.aps.vitalpair.user.domain.port.in.SetAvatarUseCase;

/**
 * Who may call the avatar endpoints, and what the image response says about itself.
 *
 * <p>The read endpoint being public is the part worth a test: it is the one hole in a chain
 * where everything else is authenticated, and it is easy for a later change to the security
 * config to close it (breaking every avatar) or widen the exception past GET.
 */
@WebMvcTest(AvatarController.class)
class AvatarControllerTest extends ControllerSliceTest {

    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x01, 0x02};
    private static final String NAME = "0123456789abcdef0123456789abcdef.jpg";

    @MockitoBean
    private SetAvatarUseCase setAvatarUseCase;

    @MockitoBean
    private ReadAvatarUseCase readAvatarUseCase;

    private String uploadBody(byte[] bytes) {
        return toJson(Map.of("imageBase64", Base64.getEncoder().encodeToString(bytes)));
    }

    @Test
    @WithVitalPairUser
    void anuploadReturnsTheNameToFetchItBackWith() throws Exception {
        when(setAvatarUseCase.setAvatar(any(), any())).thenReturn(NAME);

        mockMvc.perform(put("/api/v1/users/me/avatar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(uploadBody(JPEG)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.avatarUrl").value(NAME));
    }

    @Test
    void anuploadWithoutAsessionIsRefused() throws Exception {
        mockMvc.perform(put("/api/v1/users/me/avatar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(uploadBody(JPEG)))
                .andExpect(status().isUnauthorized());

        // Not merely a 401: nothing reached the use case, so an unauthenticated request cannot
        // spend the CPU that decoding an image costs.
        verify(setAvatarUseCase, never()).setAvatar(any(), any());
    }

    @Test
    @WithVitalPairUser
    void animageTheSanitizerRefusesAnswersUnprocessable() throws Exception {
        when(setAvatarUseCase.setAvatar(any(), any()))
                .thenThrow(new InvalidImageException("Formato não aceito. Envie um JPEG, PNG ou WebP."));

        mockMvc.perform(put("/api/v1/users/me/avatar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(uploadBody("not an image".getBytes(StandardCharsets.UTF_8))))
                // 422 and not 400: the request is well formed, the content is the problem. A 400
                // would tell the client its JSON was wrong, which sends it looking in the wrong
                // place.
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Formato não aceito. Envie um JPEG, PNG ou WebP."));
    }

    @Test
    @WithVitalPairUser
    void anemptyBodyIsAvalidationError() throws Exception {
        mockMvc.perform(put("/api/v1/users/me/avatar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("imageBase64", ""))))
                .andExpect(status().isBadRequest());

        verify(setAvatarUseCase, never()).setAvatar(any(), any());
    }

    @Test
    @WithVitalPairUser
    void base64ThatIsNotBase64IsRefusedAsAnImageProblem() throws Exception {
        mockMvc.perform(put("/api/v1/users/me/avatar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("imageBase64", "!!!! not base64 !!!!"))))
                // Decoded in the controller so it reads as "that file will not do" rather than
                // as an unreadable body, which is what Jackson would have called it.
                .andExpect(status().isUnprocessableEntity());

        verify(setAvatarUseCase, never()).setAvatar(any(), any());
    }

    @Test
    @WithVitalPairUser
    void anuploadOverTheCeilingIsRefusedBeforeReachingTheUseCase() throws Exception {
        // One byte past what the record allows, expressed in base64 characters.
        String tooLong = "A".repeat(AvatarUploadRequest.MAX_BASE64_LENGTH + 4);

        mockMvc.perform(put("/api/v1/users/me/avatar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("imageBase64", tooLong))))
                .andExpect(status().isBadRequest());

        // The bound exists so an oversized request costs nothing: no decode, no sanitize.
        verify(setAvatarUseCase, never()).setAvatar(any(), any());
    }

    @Test
    @WithVitalPairUser
    void removingThePhotoAnswersOk() throws Exception {
        mockMvc.perform(delete("/api/v1/users/me/avatar")).andExpect(status().isOk());

        verify(setAvatarUseCase).removeAvatar(any());
    }

    @Test
    void removingWithoutAsessionIsRefused() throws Exception {
        mockMvc.perform(delete("/api/v1/users/me/avatar")).andExpect(status().isUnauthorized());

        verify(setAvatarUseCase, never()).removeAvatar(any());
    }

    @Test
    void aphotoIsReadableWithNoSessionAtAll() throws Exception {
        when(readAvatarUseCase.readAvatar(NAME)).thenReturn(Optional.of(JPEG));

        // No @WithVitalPairUser: an <img> tag cannot send an Authorization header, so this
        // endpoint has to answer without one or no avatar renders anywhere.
        mockMvc.perform(get("/api/v1/users/avatars/{name}", NAME))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_JPEG))
                .andExpect(content().bytes(JPEG));
    }

    @Test
    void thephotoResponseSaysItIsAnimageAndMayBeCached() throws Exception {
        when(readAvatarUseCase.readAvatar(NAME)).thenReturn(Optional.of(JPEG));

        mockMvc.perform(get("/api/v1/users/avatars/{name}", NAME))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Content-Disposition", "inline; filename=\"avatar.jpg\""))
                // A year is only safe because the name changes on every upload: a new photo is
                // a new URL, so there is nothing to invalidate.
                .andExpect(header().string("Cache-Control", "max-age=31536000, public, immutable"));
    }

    @Test
    void anameThatMatchesNothingIsNotFound() throws Exception {
        when(readAvatarUseCase.readAvatar(eq("ffffffffffffffffffffffffffffffff.jpg")))
                .thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/users/avatars/{name}", "ffffffffffffffffffffffffffffffff.jpg"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithVitalPairUser
    void thebytesHandedToTheUseCaseAreTheDecodedImage() throws Exception {
        when(setAvatarUseCase.setAvatar(any(), any())).thenReturn(NAME);

        mockMvc.perform(put("/api/v1/users/me/avatar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(uploadBody(JPEG)))
                .andExpect(status().isOk());

        // Decoded, not the base64 string: passing the text through would make every byte check
        // downstream meaningless.
        verify(setAvatarUseCase).setAvatar(any(), eq(JPEG));
    }

    /** Referenced so the sanitizer bean is not thought unused by the slice's context. */
    @MockitoBean
    private ImageSanitizer sanitizer;
}
