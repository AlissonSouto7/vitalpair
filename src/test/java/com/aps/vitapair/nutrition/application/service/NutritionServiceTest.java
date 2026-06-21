package com.aps.vitapair.nutrition.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aps.vitapair.nutrition.application.dto.DailySummary;
import com.aps.vitapair.nutrition.application.dto.LogMealCommand;
import com.aps.vitapair.nutrition.domain.model.FoodLog;
import com.aps.vitapair.nutrition.domain.model.FoodSource;
import com.aps.vitapair.nutrition.domain.model.MealType;
import com.aps.vitapair.nutrition.domain.port.out.FoodLogRepositoryPort;
import com.aps.vitapair.nutrition.domain.port.out.OpenFoodFactsPort;
import com.aps.vitapair.shared.exception.ResourceNotFoundException;
import com.aps.vitapair.user.domain.model.User;
import com.aps.vitapair.user.domain.port.out.UserRepositoryPort;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NutritionServiceTest {

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID TENANT_ID = UUID.randomUUID();

    @Mock
    private FoodLogRepositoryPort foodLogRepository;
    @Mock
    private OpenFoodFactsPort openFoodFacts;
    @Mock
    private UserRepositoryPort userRepository;
    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;
    @InjectMocks
    private NutritionService service;

    @Test
    void logMealUsaTenantDoUsuarioEPreencheZerosEData() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(
                User.builder().id(USER_ID).tenantId(TENANT_ID).email("a@a.com").name("Ana").build()));
        when(foodLogRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var command = new LogMealCommand("Arroz", null, bd(100), bd(130), null, null, null,
                MealType.LUNCH, FoodSource.MANUAL, null);

        FoodLog saved = service.logMeal(USER_ID, command);

        assertThat(saved.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(saved.getUserId()).isEqualTo(USER_ID);
        assertThat(saved.getProteinG()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(saved.getLoggedAt()).isNotNull();
    }

    @Test
    void deleteDeRegistroDeOutroUsuarioRetornaNotFound() {
        UUID logId = UUID.randomUUID();
        FoodLog otherUsersLog = FoodLog.builder().id(logId).userId(UUID.randomUUID()).build();
        when(foodLogRepository.findById(logId)).thenReturn(Optional.of(otherUsersLog));

        assertThatThrownBy(() -> service.delete(USER_ID, logId))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(foodLogRepository, never()).deleteById(any());
    }

    @Test
    void getSummarySomaConsumoECalculaRestante() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(User.builder()
                .id(USER_ID).tenantId(TENANT_ID).email("a@a.com").name("Ana")
                .dailyCalorieTarget(1800).proteinTargetG(120).carbTargetG(180).fatTargetG(60).build()));
        when(foodLogRepository.findByUserAndDate(eq(USER_ID), any())).thenReturn(List.of(
                log(bd(300), bd(20), bd(40), bd(10)),
                log(bd(200), bd(10), bd(30), bd(5))));

        DailySummary summary = service.getSummary(USER_ID, LocalDate.now());

        assertThat(summary.consumedCalories()).isEqualTo(500);
        assertThat(summary.consumedProteinG()).isEqualTo(30);
        assertThat(summary.remainingCalories()).isEqualTo(1300);
        assertThat(summary.mealCount()).isEqualTo(2);
    }

    @Test
    void findByBarcodeInexistenteLancaNotFound() {
        when(openFoodFacts.findByBarcode("000")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findByBarcode("000"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private FoodLog log(BigDecimal kcal, BigDecimal protein, BigDecimal carb, BigDecimal fat) {
        return FoodLog.builder()
                .caloriesKcal(kcal).proteinG(protein).carbG(carb).fatG(fat)
                .build();
    }

    private static BigDecimal bd(double value) {
        return BigDecimal.valueOf(value);
    }
}
