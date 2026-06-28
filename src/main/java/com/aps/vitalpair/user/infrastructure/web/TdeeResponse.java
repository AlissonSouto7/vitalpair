package com.aps.vitalpair.user.infrastructure.web;

import com.aps.vitalpair.tdee.domain.model.TdeeResult;

public record TdeeResponse(
        int bmr,
        int tdee,
        int dailyCalorieTarget,
        int proteinTargetG,
        int carbTargetG,
        int fatTargetG) {

    public static TdeeResponse from(TdeeResult result) {
        return new TdeeResponse(
                result.bmr(),
                result.tdee(),
                result.dailyCalorieTarget(),
                result.proteinTargetG(),
                result.carbTargetG(),
                result.fatTargetG());
    }
}
