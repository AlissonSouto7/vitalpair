package com.aps.vitalpair.shared.time;

import static java.lang.annotation.ElementType.ANNOTATION_TYPE;
import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.ElementType.PARAMETER;
import static java.lang.annotation.ElementType.RECORD_COMPONENT;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;
import java.time.Duration;
import java.time.Instant;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

/**
 * An instant that is not in the future.
 *
 * <p>Bean Validation's own {@code @PastOrPresent} would do this, except for the boundary: a
 * client stamps {@code loggedAt} from its own clock, which can sit a little ahead of the
 * server's, so an honest "now" arrives a few milliseconds in the future and a strict check
 * rejects it. A small tolerance ({@link #TOLERANCE}) absorbs that skew while still refusing a
 * date chosen to be in the future, which is the abuse this guards against: the streak, the
 * point ledger and the weekly competition are keyed on this date, and a future one fabricates
 * a score nobody earned.
 *
 * <p>Null passes, because the field is optional and its absence means "use now" at the service.
 * A past instant passes too: logging yesterday's forgotten meal is a legitimate correction.
 */
@Documented
@Constraint(validatedBy = NotInFuture.Validator.class)
@Target({FIELD, PARAMETER, RECORD_COMPONENT, ANNOTATION_TYPE})
@Retention(RUNTIME)
public @interface NotInFuture {

    /** How far ahead of the server's clock a client's instant may sit and still be accepted. */
    Duration TOLERANCE = Duration.ofMinutes(2);

    String message() default "a data não pode estar no futuro";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    class Validator implements ConstraintValidator<NotInFuture, Instant> {

        @Override
        public boolean isValid(Instant value, ConstraintValidatorContext context) {
            return value == null || !value.isAfter(Instant.now().plus(TOLERANCE));
        }
    }
}
