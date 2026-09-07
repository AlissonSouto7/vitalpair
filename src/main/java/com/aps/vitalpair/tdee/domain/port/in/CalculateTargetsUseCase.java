package com.aps.vitalpair.tdee.domain.port.in;

import com.aps.vitalpair.tdee.domain.model.TdeeInput;
import com.aps.vitalpair.tdee.domain.model.TdeeResult;

/** Computes BMR, TDEE, the calorie target and the macros from the profile. */
public interface CalculateTargetsUseCase {

    TdeeResult calculate(TdeeInput input);
}
