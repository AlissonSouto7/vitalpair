package com.aps.vitalpair.tdee.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import com.aps.vitalpair.tdee.domain.model.TdeeInput;
import com.aps.vitalpair.tdee.domain.model.TdeeResult;
import com.aps.vitalpair.user.domain.model.ActivityLevel;
import com.aps.vitalpair.user.domain.model.Goal;
import com.aps.vitalpair.user.domain.model.Sex;

class TdeeServiceTest {

    private final TdeeService service = new TdeeService();

    @Test
    void homemGanhoDeMassa() {
        // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 1780; TDEE = 1780*1.55 = 2759; meta = +300 = 3059
        TdeeResult r = service.calculate(
                new TdeeInput(Sex.MALE, 30, bd(180), bd(80), ActivityLevel.MODERATE, Goal.GAIN_MUSCLE));

        assertThat(r.bmr()).isEqualTo(1780);
        assertThat(r.tdee()).isEqualTo(2759);
        assertThat(r.dailyCalorieTarget()).isEqualTo(3059);
        assertThat(r.proteinTargetG()).isEqualTo(176); // 80 * 2.2
        assertThat(r.fatTargetG()).isEqualTo(80); // 80 * 1.0
        assertThat(r.carbTargetG()).isEqualTo(408); // (3059 - 704 - 720) / 4
    }

    @Test
    void mulherPerdaDePeso() {
        // BMR = 10*65 + 6.25*165 - 5*25 - 161 = 1395.25; TDEE = *1.375 = 1918; meta = -500 = 1418
        TdeeResult r = service.calculate(
                new TdeeInput(Sex.FEMALE, 25, bd(165), bd(65), ActivityLevel.LIGHT, Goal.LOSE_WEIGHT));

        assertThat(r.bmr()).isEqualTo(1395);
        assertThat(r.tdee()).isEqualTo(1918);
        assertThat(r.dailyCalorieTarget()).isEqualTo(1418);
        assertThat(r.proteinTargetG()).isEqualTo(130); // 65 * 2.0
        assertThat(r.fatTargetG()).isEqualTo(52); // 65 * 0.8
        assertThat(r.carbTargetG()).isEqualTo(107); // (1418 - 520 - 468) / 4
    }

    @Test
    void manterPesoNaoAjustaCalorias() {
        TdeeResult r =
                service.calculate(new TdeeInput(Sex.MALE, 40, bd(175), bd(75), ActivityLevel.SEDENTARY, Goal.MAINTAIN));

        assertThat(r.dailyCalorieTarget()).isEqualTo(r.tdee());
    }

    private static BigDecimal bd(double value) {
        return BigDecimal.valueOf(value);
    }
}
