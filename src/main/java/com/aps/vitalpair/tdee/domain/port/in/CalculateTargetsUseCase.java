package com.aps.vitalpair.tdee.domain.port.in;

import com.aps.vitalpair.tdee.domain.model.TdeeInput;
import com.aps.vitalpair.tdee.domain.model.TdeeResult;

/** Calcula BMR, TDEE, meta calórica e macros a partir do perfil. */
public interface CalculateTargetsUseCase {

    TdeeResult calculate(TdeeInput input);
}
