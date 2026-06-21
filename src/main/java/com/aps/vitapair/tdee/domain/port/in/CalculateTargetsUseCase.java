package com.aps.vitapair.tdee.domain.port.in;

import com.aps.vitapair.tdee.domain.model.TdeeInput;
import com.aps.vitapair.tdee.domain.model.TdeeResult;

/** Calcula BMR, TDEE, meta calórica e macros a partir do perfil. */
public interface CalculateTargetsUseCase {

    TdeeResult calculate(TdeeInput input);
}
