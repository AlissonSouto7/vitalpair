package com.aps.vitalpair.season.infrastructure.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateStakeRequest(@NotBlank @Size(max = 255) String stake) {
}
