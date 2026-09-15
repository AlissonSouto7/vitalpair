package com.aps.vitalpair.user.infrastructure.web;

import java.util.Base64;

import jakarta.validation.Valid;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.shared.image.InvalidImageException;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import com.aps.vitalpair.shared.web.StandardApiResponses;
import com.aps.vitalpair.user.domain.port.in.ReadAvatarUseCase;
import com.aps.vitalpair.user.domain.port.in.SetAvatarUseCase;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * The profile photo: uploading one, removing it, and serving it.
 *
 * <p>Split from {@link UserController} because the read side is public and everything on that
 * controller is authenticated. Keeping them together would have meant a path exception inside a
 * controller whose whole surface is private, which is the kind of thing that gets widened by
 * accident later.
 *
 * <p>The image arrives as base64 in a JSON body rather than as multipart. That is the convention
 * already in this codebase (the meal photo endpoint does the same), it keeps every response in
 * the standard {@code ApiResponse} envelope, and it means no multipart parser is introduced for
 * one endpoint. The cost is a third more bytes on the wire, which for a 4 MB ceiling is
 * acceptable and is already accounted for in the proxy's body limit.
 */
@Tag(name = "Avatar", description = "Uploading and serving the profile photo.")
@RestController
@RequestMapping("/api/v1/users")
public class AvatarController {

    private final SetAvatarUseCase setAvatarUseCase;
    private final ReadAvatarUseCase readAvatarUseCase;

    public AvatarController(SetAvatarUseCase setAvatarUseCase, ReadAvatarUseCase readAvatarUseCase) {
        this.setAvatarUseCase = setAvatarUseCase;
        this.readAvatarUseCase = readAvatarUseCase;
    }

    @StandardApiResponses
    @Operation(
            summary = "Set the profile photo",
            description =
                    "Takes a JPEG, PNG or WebP as base64, up to 4 MB decoded. The image is decoded, cropped square, scaled to 512px and re-encoded as JPEG by the server, so metadata (including any GPS coordinates) and anything appended to the file do not survive. Answers 422 when the bytes are not an image we accept. Limited to ten changes an hour per user. Returns the opaque name to fetch it back with.")
    @PutMapping("/me/avatar")
    public ResponseEntity<ApiResponse<AvatarResponse>> setAvatar(
            @AuthenticationPrincipal AuthenticatedUser principal, @Valid @RequestBody AvatarUploadRequest request) {
        byte[] decoded = decodeOrReject(request.imageBase64());
        String objectName = setAvatarUseCase.setAvatar(principal.userId(), decoded);
        return ResponseEntity.ok(ApiResponse.ok(new AvatarResponse(objectName), "Foto atualizada"));
    }

    @StandardApiResponses
    @Operation(summary = "Remove the profile photo", description = "Clears the photo and deletes the stored file.")
    @DeleteMapping("/me/avatar")
    public ResponseEntity<ApiResponse<Void>> removeAvatar(@AuthenticationPrincipal AuthenticatedUser principal) {
        setAvatarUseCase.removeAvatar(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(null, "Foto removida"));
    }

    /**
     * Serves a stored photo.
     *
     * <p>Public, because an {@code <img>} tag cannot send an Authorization header, and the
     * alternative (fetching with the token and building a blob URL) loses browser caching on
     * every screen that shows an avatar. What stands in for authorization is the name: 128 bits
     * of randomness, handed out only with a profile the caller is already allowed to read.
     *
     * <p>Answers with bytes, not the envelope: it is an image, and the browser is the client.
     * Four things on the response matter as much as the image itself:
     *
     * <ul>
     *   <li>{@code image/jpeg} explicitly, because the sanitizer guarantees that is what it is.
     *   <li>{@code nosniff}, so a browser cannot be talked into treating it as anything else.
     *   <li>{@code Content-Disposition: inline} with a fixed filename, so a download cannot be
     *       steered by the stored name.
     *   <li>A long cache, which is safe only because the name changes on every upload: a new
     *       photo is a new URL, so nothing has to be invalidated.
     * </ul>
     */
    @Operation(
            summary = "Fetch a profile photo",
            description =
                    "Returns the JPEG. Public: the name is unguessable and is only handed out with a profile the caller can already read, which is what lets an image tag load it. Answers 404 for any name that matches nothing.")
    @GetMapping("/avatars/{objectName}")
    public ResponseEntity<byte[]> getAvatar(@PathVariable String objectName) {
        return readAvatarUseCase
                .readAvatar(objectName)
                .map(bytes -> ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .header("X-Content-Type-Options", "nosniff")
                        .header("Content-Disposition", "inline; filename=\"avatar.jpg\"")
                        .cacheControl(CacheControl.maxAge(java.time.Duration.ofDays(365))
                                .cachePublic()
                                .immutable())
                        .body(bytes))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Base64 in, bytes out, with a refusal the caller can act on.
     *
     * <p>Jackson would report a malformed string as an unreadable body, which is a 400 saying
     * the JSON is wrong when the JSON is fine. Decoding here turns it into the same 422 as every
     * other "that file will not do" answer.
     */
    private static byte[] decodeOrReject(String imageBase64) {
        try {
            return Base64.getDecoder().decode(imageBase64);
        } catch (IllegalArgumentException e) {
            throw new InvalidImageException("Não foi possível ler essa imagem.");
        }
    }
}
