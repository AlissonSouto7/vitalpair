package com.aps.vitalpair.user.infrastructure.web;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import com.aps.vitalpair.user.domain.model.ActivityLevel;
import com.aps.vitalpair.user.domain.model.Goal;
import com.aps.vitalpair.user.domain.model.Sex;

public record UpdateProfileRequest(
        @NotNull @Size(min = 1, max = 100) String name,
        @NotNull @Past LocalDate birthDate,
        @NotNull Sex sex,
        @NotNull @DecimalMin("50.0") @DecimalMax("300.0") BigDecimal heightCm,
        @NotNull @DecimalMin("20.0") @DecimalMax("500.0") BigDecimal weightKg,
        @NotNull Goal goal,
        @NotNull ActivityLevel activityLevel,
        /*
         * The photo is not set through this form any more: PUT /users/me/avatar is, and it is the
         * only thing that writes this field. Kept in the request so a client that still sends the
         * profile it read back does not fail validation, and constrained to a name this server
         * generated.
         *
         * It used to accept any https URL, and the previous note here reasoned about the risk
         * correctly but stopped one step short: one person's avatar is rendered in the other's
         * browser, so an external address is a tracker that hands whoever chose it the partner's
         * IP, user agent and the exact time they opened the app, on every visit. https was the
         * wrong axis, because the problem is third-party origin and not transport. Verified on a
         * running server before this change: "https://evil.example.com/beacon.png" was accepted.
         *
         * The pattern is the object name the storage adapter produces, which cannot express a
         * path, a scheme or a host, so there is nowhere for it to point but here.
         */
        @Size(max = 500)
                @Pattern(regexp = "^$|^[0-9a-f]{32}\\.jpg$", message = "A foto de perfil é enviada em /users/me/avatar")
                String avatarUrl,
        /*
         * Optional: omitting it leaves the stored preference alone, so a client that does not
         * know about the field cannot silently reset someone's zone. Validated against the JVM's
         * time zone database rather than a regex, because the only thing that matters is whether
         * the server can turn it into a day boundary.
         */
        @Size(max = 64) @ValidTimeZone String timeZone) {}
