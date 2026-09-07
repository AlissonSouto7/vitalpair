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
         * O avatar de uma pessoa é renderizado no navegador da outra, então esta string
         * decide para onde o navegador do parceiro faz uma requisição. Sem restrição de
         * esquema, qualquer endereço servia como rastreador: quem escolhe o avatar recebe o
         * IP e o user-agent do parceiro toda vez que ele abre a tela do par. Só https, e o
         * regex recusa "javascript:" e "data:" por construção.
         */
        @Size(max = 500) @Pattern(regexp = "^$|^https://[^\\s\"'<>]+$", message = "avatarUrl deve ser uma URL https")
                String avatarUrl) {}
