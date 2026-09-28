package com.aps.vitalpair.shared.time;

import static java.lang.annotation.ElementType.ANNOTATION_TYPE;
import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.ElementType.PARAMETER;
import static java.lang.annotation.ElementType.RECORD_COMPONENT;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;
import java.time.LocalDate;
import java.time.ZoneId;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

/**
 * Uma data que não está no futuro.
 *
 * <p>O {@code @PastOrPresent} do Bean Validation compara com a data do servidor, e o servidor
 * roda em UTC: alguém no Brasil registrando às 22h de segunda mandaria uma data que, para o
 * servidor, já é terça, e seria recusado por escrever a verdade. A comparação aqui é feita na
 * zona do produto, com um dia de folga, que cobre qualquer fuso do mundo sem abrir espaço para
 * marcar a semana que vem.
 *
 * <p>Nulo passa: o campo é opcional e a ausência quer dizer hoje, decidido no serviço, que
 * conhece o fuso de quem registra.
 */
@Documented
@Constraint(validatedBy = NotInFutureDate.Validator.class)
@Target({FIELD, PARAMETER, RECORD_COMPONENT, ANNOTATION_TYPE})
@Retention(RUNTIME)
public @interface NotInFutureDate {

    String message() default "a data não pode estar no futuro";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    class Validator implements ConstraintValidator<NotInFutureDate, LocalDate> {

        @Override
        public boolean isValid(LocalDate value, ConstraintValidatorContext context) {
            // Um dia de folga absorve qualquer fuso; a regra continua recusando "semana que vem".
            return value == null
                    || !value.isAfter(LocalDate.now(ZoneId.of("UTC")).plusDays(1));
        }
    }
}
