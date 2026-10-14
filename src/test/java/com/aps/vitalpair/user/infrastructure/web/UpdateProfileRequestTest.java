package com.aps.vitalpair.user.infrastructure.web;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import com.aps.vitalpair.user.domain.model.ActivityLevel;
import com.aps.vitalpair.user.domain.model.Goal;
import com.aps.vitalpair.user.domain.model.Sex;

/**
 * As regras de validação do formulário de perfil.
 *
 * <p>Este formulário escreve o nome que aparece na tela do parceiro, no feed e no placar, e
 * o serviço grava o valor sem aparar espaço. Então o que esta classe recusa é exatamente o
 * que não pode chegar ao banco.
 *
 * <p>O nome em branco não era hipótese: antes da correção, {@code @Size(min = 1)} aceitava
 * {@code " "}, porque um espaço tem tamanho 1. Medido contra este mesmo record, as três
 * variações em branco passavam com zero violações, enquanto o cadastro, que usa
 * {@code @NotBlank}, recusava as mesmas entradas. Os dois formulários escrevem a mesma
 * coluna e discordavam.
 */
class UpdateProfileRequestTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void startValidator() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void closeValidator() {
        factory.close();
    }

    /** Um perfil que passa, para que cada teste mude só o campo que está medindo. */
    private static UpdateProfileRequest withName(String name) {
        return new UpdateProfileRequest(
                name,
                LocalDate.of(1995, 5, 20),
                Sex.FEMALE,
                new BigDecimal("165.0"),
                new BigDecimal("60.0"),
                null,
                Goal.LOSE_WEIGHT,
                ActivityLevel.MODERATE,
                "",
                "America/Sao_Paulo");
    }

    private static Set<ConstraintViolation<UpdateProfileRequest>> violationsFor(String name) {
        return validator.validate(withName(name));
    }

    @ParameterizedTest(name = "nome [{0}] é recusado")
    @ValueSource(strings = {" ", "   ", "\t", "\n", " \t "})
    @DisplayName("a name made of whitespace is refused, the way registration refuses it")
    void aNameMadeOfWhitespaceIsRefused(String branco) {
        assertThat(violationsFor(branco))
                .as("um nome em branco é gravado como está e cada tela cai no seu placeholder")
                .isNotEmpty();
    }

    @Test
    @DisplayName("the empty string is refused as well")
    void theEmptyStringIsRefused() {
        assertThat(violationsFor("")).isNotEmpty();
    }

    @Test
    @DisplayName("null is refused, so the field cannot simply be left out")
    void nullIsRefused() {
        assertThat(violationsFor(null)).isNotEmpty();
    }

    @Test
    @DisplayName("a real name passes, including the accents a Portuguese name has")
    void aRealNamePasses() {
        // Se este falhasse, a correção acima teria fechado o formulário para todo mundo, que
        // é o jeito de uma validação nova causar mais estrago que o buraco que ela tapa.
        assertThat(violationsFor("Célia")).isEmpty();
        assertThat(violationsFor("José Antônio da Silva")).isEmpty();
    }

    @Test
    @DisplayName("a name with spaces inside it passes: only an all-blank name is refused")
    void aNameWithInnerSpacesPasses() {
        assertThat(violationsFor("Ana Paula")).isEmpty();
    }

    @Test
    @DisplayName("the hundred character limit is still enforced")
    void theLengthLimitIsStillEnforced() {
        // @NotBlank substituiu o min = 1, e não o max: o limite da coluna continua valendo.
        assertThat(violationsFor("a".repeat(100))).isEmpty();
        assertThat(violationsFor("a".repeat(101))).isNotEmpty();
    }
}
