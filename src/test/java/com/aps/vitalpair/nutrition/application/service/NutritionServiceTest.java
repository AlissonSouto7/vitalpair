package com.aps.vitalpair.nutrition.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

import com.aps.vitalpair.nutrition.application.dto.DailySummary;
import com.aps.vitalpair.nutrition.application.dto.LogMealCommand;
import com.aps.vitalpair.nutrition.domain.model.FoodCategory;
import com.aps.vitalpair.nutrition.domain.model.FoodLog;
import com.aps.vitalpair.nutrition.domain.model.FoodProduct;
import com.aps.vitalpair.nutrition.domain.model.FoodSource;
import com.aps.vitalpair.nutrition.domain.model.MealType;
import com.aps.vitalpair.nutrition.domain.port.out.FoodLogRepositoryPort;
import com.aps.vitalpair.nutrition.domain.port.out.OpenFoodFactsPort;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

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

    @Mock
    private com.aps.vitalpair.nutrition.domain.port.out.FoodCatalogPort catalog;

    @InjectMocks
    private NutritionService service;

    @Test
    void logsAmealUnderTheCallersTenantFillingZerosAndTheDate() {
        when(userRepository.findById(USER_ID))
                .thenReturn(Optional.of(User.builder()
                        .id(USER_ID)
                        .tenantId(TENANT_ID)
                        .email("a@a.com")
                        .name("Ana")
                        .build()));
        when(foodLogRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var command = new LogMealCommand(
                "Arroz", null, bd(100), bd(130), null, null, null, MealType.LUNCH, FoodSource.MANUAL, false, null);

        FoodLog saved = service.logMeal(USER_ID, command);

        assertThat(saved.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(saved.getUserId()).isEqualTo(USER_ID);
        assertThat(saved.getProteinG()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(saved.getLoggedAt()).isNotNull();
    }

    @Test
    void deletingAnotherPersonsEntryIsNotFound() {
        UUID logId = UUID.randomUUID();
        FoodLog otherUsersLog =
                FoodLog.builder().id(logId).userId(UUID.randomUUID()).build();
        when(foodLogRepository.findById(logId)).thenReturn(Optional.of(otherUsersLog));

        assertThatThrownBy(() -> service.delete(USER_ID, logId)).isInstanceOf(ResourceNotFoundException.class);
        verify(foodLogRepository, never()).deleteById(any());
    }

    @Test
    void sumsIntakeAndWorksOutWhatIsLeft() {
        when(userRepository.findById(USER_ID))
                .thenReturn(Optional.of(User.builder()
                        .id(USER_ID)
                        .tenantId(TENANT_ID)
                        .email("a@a.com")
                        .name("Ana")
                        .dailyCalorieTarget(1800)
                        .proteinTargetG(120)
                        .carbTargetG(180)
                        .fatTargetG(60)
                        .build()));
        when(foodLogRepository.findByUserAndDay(eq(USER_ID), any()))
                .thenReturn(List.of(log(bd(300), bd(20), bd(40), bd(10)), log(bd(200), bd(10), bd(30), bd(5))));

        DailySummary summary = service.getSummary(USER_ID, LocalDate.now());

        assertThat(summary.consumedCalories()).isEqualTo(500);
        assertThat(summary.consumedProteinG()).isEqualTo(30);
        assertThat(summary.remainingCalories()).isEqualTo(1300);
        assertThat(summary.mealCount()).isEqualTo(2);
    }

    @Test
    void abarcodeNobodyHasIsNotFound() {
        when(openFoodFacts.findByBarcode("000")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findByBarcode("000")).isInstanceOf(ResourceNotFoundException.class);
    }

    private FoodLog log(BigDecimal kcal, BigDecimal protein, BigDecimal carb, BigDecimal fat) {
        return FoodLog.builder()
                .caloriesKcal(kcal)
                .proteinG(protein)
                .carbG(carb)
                .fatG(fat)
                .build();
    }

    private static BigDecimal bd(double value) {
        return BigDecimal.valueOf(value);
    }

    /** Um alimento do catálogo: sem código de barras, com os números da tabela. */
    private static FoodProduct doCatalogo(String nome) {
        return new FoodProduct(
                nome, null, new BigDecimal("128"), BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE, FoodCategory.STAPLE);
    }

    /** Um produto de marca. Calorias nulas quer dizer que ninguém preencheu a tabela dele. */
    private static FoodProduct deMarca(String nome, boolean comNumeros) {
        return new FoodProduct(
                nome,
                "789" + nome.hashCode(),
                comNumeros ? new BigDecimal("350") : null,
                null,
                null,
                null,
                FoodCategory.OTHER);
    }

    @Test
    void theSearchIsCappedSoTheResultsDoNotPushTheEditorOffTheScreen() {
        when(catalog.search(eq("arroz"), anyInt())).thenReturn(List.of(doCatalogo("Arroz branco cozido")));
        when(openFoodFacts.searchByName("arroz"))
                .thenReturn(java.util.stream.IntStream.range(0, 30)
                        .mapToObj(i -> deMarca("Marca " + i, true))
                        .toList());

        List<FoodProduct> resultado = service.search("arroz");

        /*
         * Medido num iPhone 12 em 28/09/2026: "arroz" devolvia 20 itens, 3 do catálogo e 17
         * produtos de marca, e a lista empurrava o editor para muito abaixo do que a pessoa
         * estava vendo. Quem quer registrar arroz não escolhe entre dezessete embalagens.
         */
        assertThat(resultado).hasSize(10);
        assertThat(resultado.get(0).name()).isEqualTo("Arroz branco cozido");
    }

    @Test
    void afoodWithNoNumbersGoesToTheBottomOfTheList() {
        when(catalog.search(eq("arroz"), anyInt())).thenReturn(List.of());
        when(openFoodFacts.searchByName("arroz"))
                .thenReturn(List.of(deMarca("Sem tabela", false), deMarca("Com tabela", true)));

        List<FoodProduct> resultado = service.search("arroz");

        /*
         * Escolher um item sem tabela custa preencher os números na mão, então ele fica abaixo
         * de todos os que já vêm prontos. Continua na lista porque alguém pode querer aquela
         * marca exata; o que muda é a ordem, não a existência.
         */
        assertThat(resultado.stream().map(FoodProduct::name)).containsExactly("Com tabela", "Sem tabela");
    }

    @Test
    void theCatalogueStillComesFirstAndDuplicatesStillDisappear() {
        when(catalog.search(eq("arroz"), anyInt())).thenReturn(List.of(doCatalogo("Arroz branco cozido")));
        when(openFoodFacts.searchByName("arroz"))
                .thenReturn(List.of(deMarca("arroz branco cozido", true), deMarca("Arroz Tio João", true)));

        List<FoodProduct> resultado = service.search("arroz");

        // O teto e a reordenação não podem ter desfeito o que a busca já garantia.
        assertThat(resultado.stream().map(FoodProduct::name)).containsExactly("Arroz branco cozido", "Arroz Tio João");
    }
}
