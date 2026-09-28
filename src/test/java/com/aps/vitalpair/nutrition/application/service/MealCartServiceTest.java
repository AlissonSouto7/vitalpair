package com.aps.vitalpair.nutrition.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.IntStream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.aps.vitalpair.nutrition.application.dto.AddToCartCommand;
import com.aps.vitalpair.nutrition.application.dto.LogMealCommand;
import com.aps.vitalpair.nutrition.domain.model.CartItem;
import com.aps.vitalpair.nutrition.domain.model.FoodLog;
import com.aps.vitalpair.nutrition.domain.model.FoodSource;
import com.aps.vitalpair.nutrition.domain.model.MealType;
import com.aps.vitalpair.nutrition.domain.port.in.LogMealUseCase;
import com.aps.vitalpair.nutrition.domain.port.in.MealCartUseCase;
import com.aps.vitalpair.nutrition.domain.port.out.CartRepositoryPort;
import com.aps.vitalpair.shared.exception.BusinessRuleException;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.in.UserDayUseCase;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * O carrinho: montar o prato antes de registrar.
 *
 * <p>O que estes testes protegem, em ordem de gravidade: que ninguém mexe no carrinho de
 * outra pessoa, que confirmar é tudo ou nada, e que um carrinho não vira um jeito de encher a
 * tabela.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MealCartServiceTest {

    private static final UUID EU = UUID.randomUUID();
    private static final UUID TENANT = UUID.randomUUID();
    private static final LocalDate HOJE = LocalDate.of(2026, 9, 28);
    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");

    @Mock
    private CartRepositoryPort cartRepository;

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private UserDayUseCase userDay;

    @Mock
    private LogMealUseCase logMeal;

    private MealCartService service;

    @BeforeEach
    void setUp() {
        Clock relogio = Clock.fixed(Instant.parse("2026-09-28T12:00:00Z"), SP);
        service = new MealCartService(cartRepository, userRepository, userDay, logMeal, relogio);

        when(userRepository.findById(EU))
                .thenReturn(Optional.of(User.builder()
                        .id(EU)
                        .tenantId(TENANT)
                        .email("celia@example.com")
                        .name("Célia")
                        .timeZone(SP)
                        .build()));
        when(userDay.today(EU)).thenReturn(HOJE);
        when(cartRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(logMeal.logMeal(any(), any())).thenAnswer(i -> {
            LogMealCommand c = i.getArgument(1);
            return FoodLog.builder()
                    .id(UUID.randomUUID())
                    .foodName(c.foodName())
                    .build();
        });
    }

    private AddToCartCommand arroz(LocalDate dia) {
        return new AddToCartCommand(
                "Arroz branco cozido",
                null,
                new BigDecimal("100"),
                new BigDecimal("128"),
                new BigDecimal("2.5"),
                new BigDecimal("28.1"),
                new BigDecimal("0.2"),
                MealType.LUNCH,
                FoodSource.MANUAL,
                false,
                dia);
    }

    private CartItem item(String nome, LocalDate dia) {
        return CartItem.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT)
                .userId(EU)
                .foodName(nome)
                .quantityG(new BigDecimal("100"))
                .caloriesKcal(new BigDecimal("128"))
                .proteinG(BigDecimal.ZERO)
                .carbG(BigDecimal.ZERO)
                .fatG(BigDecimal.ZERO)
                .mealType(MealType.LUNCH)
                .source(FoodSource.MANUAL)
                .consumedOn(dia)
                .build();
    }

    @Test
    void oItemNasceComOdonoEotenantDeQuemPediu() {
        when(cartRepository.findByOwnerAndDay(EU, HOJE)).thenReturn(List.of());

        service.addToCart(EU, arroz(null));

        ArgumentCaptor<CartItem> captor = ArgumentCaptor.forClass(CartItem.class);
        verify(cartRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(EU);
        assertThat(captor.getValue().getTenantId()).isEqualTo(TENANT);
    }

    @Test
    void semDataOcarrinhoUsaOdiaDeQuemRegistra() {
        when(cartRepository.findByOwnerAndDay(EU, HOJE)).thenReturn(List.of());

        service.addToCart(EU, arroz(null));

        // Não o dia do servidor: às 22h no Brasil o servidor em UTC já está no dia seguinte, e
        // o jantar entraria na data errada.
        ArgumentCaptor<CartItem> captor = ArgumentCaptor.forClass(CartItem.class);
        verify(cartRepository).save(captor.capture());
        assertThat(captor.getValue().getConsumedOn()).isEqualTo(HOJE);
    }

    @Test
    void oItemNasceComPrazoParaExpirar() {
        when(cartRepository.findByOwnerAndDay(EU, HOJE)).thenReturn(List.of());

        service.addToCart(EU, arroz(null));

        // Sem prazo, um prato que ninguém confirmou fica na tabela para sempre.
        ArgumentCaptor<CartItem> captor = ArgumentCaptor.forClass(CartItem.class);
        verify(cartRepository).save(captor.capture());
        assertThat(captor.getValue().getExpiresAt()).isAfter(captor.getValue().getCreatedAt());
    }

    @Test
    void semMacrosOitemNasceComZeroEnaoComNulo() {
        when(cartRepository.findByOwnerAndDay(EU, HOJE)).thenReturn(List.of());
        AddToCartCommand semMacros = new AddToCartCommand(
                "Alimento sem macros",
                null,
                new BigDecimal("100"),
                new BigDecimal("128"),
                null,
                null,
                null,
                MealType.LUNCH,
                FoodSource.MANUAL,
                false,
                null);

        service.addToCart(EU, semMacros);

        // As três colunas são NOT NULL e o pedido marca os três campos como opcionais, porque a
        // busca devolve alimento sem macro conhecido. Sem a conversão, uma entrada comum é 500.
        ArgumentCaptor<CartItem> captor = ArgumentCaptor.forClass(CartItem.class);
        verify(cartRepository).save(captor.capture());
        assertThat(captor.getValue().getProteinG()).isEqualTo(BigDecimal.ZERO);
        assertThat(captor.getValue().getCarbG()).isEqualTo(BigDecimal.ZERO);
        assertThat(captor.getValue().getFatG()).isEqualTo(BigDecimal.ZERO);
    }

    @Test
    void ocarrinhoTemTeto() {
        List<CartItem> cheio = IntStream.range(0, MealCartUseCase.MAX_ITEMS_PER_DAY)
                .mapToObj(i -> item("Item " + i, HOJE))
                .toList();
        when(cartRepository.findByOwnerAndDay(EU, HOJE)).thenReturn(cheio);

        // Não é sobre comer muito: este endereço grava uma linha por chamada, e sem teto uma
        // conta enche a tabela sozinha.
        assertThatThrownBy(() -> service.addToCart(EU, arroz(null))).isInstanceOf(BusinessRuleException.class);
        verify(cartRepository, never()).save(any());
    }

    @Test
    void tirarUmItemDeOutraPessoaRespondeComoItemInexistente() {
        UUID doOutro = UUID.randomUUID();
        when(cartRepository.deleteOwned(EU, doOutro)).thenReturn(false);

        // 404 e não 403: um 403 confirmaria que o id existe, e transformaria este endereço num
        // jeito de descobrir ids alheios um a um.
        assertThatThrownBy(() -> service.removeFromCart(EU, doOutro)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void confirmarGravaTodosOsItensNoDiario() {
        when(cartRepository.findForCheckout(EU, HOJE))
                .thenReturn(List.of(item("Arroz", HOJE), item("Feijão", HOJE), item("Bife", HOJE)));

        List<FoodLog> gravadas = service.checkout(EU, null);

        assertThat(gravadas).hasSize(3);
        verify(logMeal, times(3)).logMeal(eq(EU), any());
    }

    @Test
    void confirmarPassaPeloCaminhoNormalDeRegistrar() {
        when(cartRepository.findForCheckout(EU, HOJE)).thenReturn(List.of(item("Arroz", HOJE)));

        service.checkout(EU, null);

        /*
         * Pelo LogMealUseCase, e não direto ao repositório: registrar uma refeição publica o
         * evento que pontua, alimenta o mural do par e notifica. Gravar direto aqui faria o
         * carrinho ser um caminho que não pontua, e ninguém entenderia por quê.
         */
        verify(logMeal).logMeal(eq(EU), any(LogMealCommand.class));
    }

    @Test
    void confirmarEsvaziaOcarrinho() {
        when(cartRepository.findForCheckout(EU, HOJE)).thenReturn(List.of(item("Arroz", HOJE)));

        service.checkout(EU, null);

        // Sem isto, confirmar duas vezes registraria o mesmo almoço duas vezes.
        verify(cartRepository).clear(EU, HOJE);
    }

    @Test
    void umItemQueFalhaNaoDeixaMetadeDoAlmocoRegistrada() {
        when(cartRepository.findForCheckout(EU, HOJE)).thenReturn(List.of(item("Arroz", HOJE), item("Feijão", HOJE)));
        /*
         * `doAnswer` e não `when(...)`: o stub do setUp é executado durante a avaliação de
         * `when(logMeal.logMeal(...))`, com argumentos nulos, e estoura antes de conseguir
         * substituir o comportamento. `doAnswer` não chama o método real.
         */
        org.mockito.Mockito.doAnswer(i -> {
                    LogMealCommand c = i.getArgument(1);
                    if ("Feijão".equals(c.foodName())) {
                        throw new BusinessRuleException("falhou");
                    }
                    return FoodLog.builder()
                            .id(UUID.randomUUID())
                            .foodName(c.foodName())
                            .build();
                })
                .when(logMeal)
                .logMeal(any(), any());

        assertThatThrownBy(() -> service.checkout(EU, null)).isInstanceOf(BusinessRuleException.class);

        /*
         * O carrinho NÃO é esvaziado: a transação desfaz o que foi gravado, e limpar aqui
         * deixaria a pessoa sem o almoço e sem o carrinho. Metade registrada é pior que
         * nenhuma, porque ela não tem como saber o que faltou sem conferir item por item.
         */
        verify(cartRepository, never()).clear(any(), any());
    }

    @Test
    void confirmarUmCarrinhoVazioAvisaEmVezDeFingirQueDeuCerto() {
        when(cartRepository.findForCheckout(EU, HOJE)).thenReturn(List.of());

        assertThatThrownBy(() -> service.checkout(EU, null)).isInstanceOf(BusinessRuleException.class);
        verify(logMeal, never()).logMeal(any(), any());
    }

    @Test
    void oDiaDoItemViraAdataDoRegistro() {
        LocalDate ontem = HOJE.minusDays(1);
        when(cartRepository.findForCheckout(EU, ontem)).thenReturn(List.of(item("Arroz", ontem)));

        service.checkout(EU, ontem);

        // Sem isto, o que foi montado para ontem entraria no diário como comido hoje.
        ArgumentCaptor<LogMealCommand> captor = ArgumentCaptor.forClass(LogMealCommand.class);
        verify(logMeal).logMeal(eq(EU), captor.capture());
        assertThat(captor.getValue().loggedAt())
                .isEqualTo(ontem.atStartOfDay(SP).toInstant());
    }
}
