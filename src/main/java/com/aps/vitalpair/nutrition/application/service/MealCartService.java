package com.aps.vitalpair.nutrition.application.service;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.nutrition.application.dto.AddToCartCommand;
import com.aps.vitalpair.nutrition.application.dto.LogMealCommand;
import com.aps.vitalpair.nutrition.domain.model.CartItem;
import com.aps.vitalpair.nutrition.domain.model.FoodLog;
import com.aps.vitalpair.nutrition.domain.port.in.LogMealUseCase;
import com.aps.vitalpair.nutrition.domain.port.in.MealCartUseCase;
import com.aps.vitalpair.nutrition.domain.port.out.CartRepositoryPort;
import com.aps.vitalpair.shared.exception.BusinessRuleException;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.in.UserDayUseCase;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/** Ver {@link MealCartUseCase}. */
@Service
public class MealCartService implements MealCartUseCase {

    /**
     * Quanto tempo um carrinho esquecido continua valendo.
     *
     * <p>Dois dias cobrem quem monta o jantar e só confirma no dia seguinte, e ainda deixa a
     * tabela limpa. Mais que isso é guardar um prato que a pessoa já esqueceu que montou, e
     * ressuscitá-lo dias depois no meio de outra refeição confunde mais do que ajuda.
     */
    private static final Duration VALIDADE = Duration.ofDays(2);

    private final CartRepositoryPort cartRepository;
    private final UserRepositoryPort userRepository;
    private final UserDayUseCase userDay;
    private final LogMealUseCase logMeal;
    private final Clock clock;

    public MealCartService(
            CartRepositoryPort cartRepository,
            UserRepositoryPort userRepository,
            UserDayUseCase userDay,
            LogMealUseCase logMeal,
            Clock clock) {
        this.cartRepository = cartRepository;
        this.userRepository = userRepository;
        this.userDay = userDay;
        this.logMeal = logMeal;
        this.clock = clock;
    }

    @Override
    @Transactional
    public CartItem addToCart(UUID userId, AddToCartCommand command) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));

        // Nulo quer dizer hoje, e hoje é na zona da pessoa. Deixar o cliente mandar a data de
        // "agora" poria o relógio do aparelho no comando de algo que o produto inteiro calcula
        // a partir do fuso do perfil.
        LocalDate dia = command.consumedOn() != null ? command.consumedOn() : userDay.today(userId);

        /*
         * Um teto por dia.
         *
         * Não é sobre alguém comer muito: é que este endereço grava uma linha por chamada, e
         * sem limite uma conta pode encher a tabela sozinha. Cinquenta itens num dia já é mais
         * do que qualquer prato real, então o limite não atrapalha ninguém e fecha a porta.
         */
        List<CartItem> atuais = cartRepository.findByOwnerAndDay(userId, dia);
        if (atuais.size() >= MAX_ITEMS_PER_DAY) {
            throw new BusinessRuleException(
                    "Seu carrinho já está cheio. Registra o que está aí antes de adicionar mais.");
        }

        Instant agora = clock.instant();
        return cartRepository.save(CartItem.builder()
                .id(UUID.randomUUID())
                .tenantId(user.getTenantId())
                .userId(userId)
                .foodName(command.foodName())
                .barcode(command.barcode())
                .quantityG(command.quantityG())
                .caloriesKcal(command.caloriesKcal())
                .proteinG(orZero(command.proteinG()))
                .carbG(orZero(command.carbG()))
                .fatG(orZero(command.fatG()))
                .mealType(command.mealType())
                .source(command.source())
                .isPrivate(command.isPrivate())
                .consumedOn(dia)
                .createdAt(agora)
                .expiresAt(agora.plus(VALIDADE))
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CartItem> cartOf(UUID userId, LocalDate day) {
        LocalDate dia = day != null ? day : userDay.today(userId);
        return cartRepository.findByOwnerAndDay(userId, dia);
    }

    @Override
    @Transactional
    public void removeFromCart(UUID userId, UUID itemId) {
        /*
         * 404 e não 403 para o item de outra pessoa.
         *
         * Um 403 confirmaria que aquele id existe, o que transforma este endereço num jeito de
         * descobrir ids alheios um a um. A mesma regra que o resto do produto já usa para
         * apagar refeição e atividade.
         */
        if (!cartRepository.deleteOwned(userId, itemId)) {
            throw ResourceNotFoundException.of("Item do carrinho", itemId);
        }
    }

    @Override
    @Transactional
    public void clearCart(UUID userId, LocalDate day) {
        LocalDate dia = day != null ? day : userDay.today(userId);
        cartRepository.clear(userId, dia);
    }

    @Override
    @Transactional
    public List<FoodLog> checkout(UUID userId, LocalDate day) {
        LocalDate dia = day != null ? day : userDay.today(userId);
        /*
         * Lendo com trava: dois toques no botão ao mesmo tempo leriam o mesmo carrinho e
         * gravariam o mesmo almoço duas vezes, com ponto dobrado, porque a leitura e o esvaziar
         * são passos distintos dentro da transação. Com a trava a segunda espera, encontra o
         * carrinho já vazio e para na regra abaixo.
         */
        List<CartItem> itens = cartRepository.findForCheckout(userId, dia);
        if (itens.isEmpty()) {
            throw new BusinessRuleException("Não tem nada no carrinho pra registrar.");
        }

        /*
         * Tudo dentro da mesma transação, que é o que faz "tudo ou nada" ser verdade: se o
         * quinto item falhar, os quatro primeiros não ficam no diário e o carrinho continua
         * inteiro para a pessoa tentar de novo. Metade de um almoço registrado é pior que
         * nenhum, porque ela não tem como saber o que faltou sem conferir item por item.
         *
         * Cada item passa pelo LogMealUseCase, e não direto ao repositório, porque registrar
         * uma refeição não é só gravar uma linha: publica o evento que pontua, alimenta o
         * mural do par e notifica. Duplicar isso aqui seria assinar que os dois caminhos vão
         * divergir.
         */
        // O fuso é lido uma vez, fora do laço: dentro dele seria uma consulta ao banco por
        // item, para responder sempre a mesma coisa.
        var zona = user(userId).zone();

        List<FoodLog> gravadas = new ArrayList<>(itens.size());
        for (CartItem item : itens) {
            gravadas.add(logMeal.logMeal(
                    userId,
                    new LogMealCommand(
                            item.getFoodName(),
                            item.getBarcode(),
                            item.getQuantityG(),
                            item.getCaloriesKcal(),
                            item.getProteinG(),
                            item.getCarbG(),
                            item.getFatG(),
                            item.getMealType(),
                            item.getSource(),
                            item.isPrivate(),
                            // A data do carrinho vira o instante do registro. Sem isto, um item
                            // montado para ontem entraria como comido hoje.
                            item.getConsumedOn().atStartOfDay(zona).toInstant())));
        }

        cartRepository.clear(userId, dia);
        return gravadas;
    }

    /**
     * A ausência de um macro vira zero, como no caminho normal de registrar.
     *
     * <p>A busca devolve alimento cuja proteína, carboidrato e gordura ninguém sabe, e o
     * formulário manual deixa preencher só a caloria. O pedido marca os três como opcionais,
     * então o cliente tem direito de omitir; as colunas são NOT NULL. Sem esta conversão, uma
     * entrada comum responde 500.
     */
    private static BigDecimal orZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private User user(UUID userId) {
        return userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
    }
}
