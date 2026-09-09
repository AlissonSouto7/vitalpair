package com.aps.vitalpair.user.infrastructure.web;

import static java.lang.annotation.ElementType.ANNOTATION_TYPE;
import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.ElementType.PARAMETER;
import static java.lang.annotation.ElementType.RECORD_COMPONENT;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import com.aps.vitalpair.user.domain.model.UserTimeZones;

/**
 * An IANA time zone identifier the server can actually resolve.
 *
 * <p>Null and blank pass, because the field is optional and its absence means "leave it alone".
 * A list of allowed names is deliberately not used: the set changes with the JVM's time zone
 * database, and a hardcoded list would reject a zone the server itself understands.
 */
@Documented
@Constraint(validatedBy = ValidTimeZone.Validator.class)
@Target({FIELD, PARAMETER, RECORD_COMPONENT, ANNOTATION_TYPE})
@Retention(RUNTIME)
public @interface ValidTimeZone {

    String message() default "fuso horário desconhecido";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    class Validator implements ConstraintValidator<ValidTimeZone, String> {

        @Override
        public boolean isValid(String value, ConstraintValidatorContext context) {
            return value == null || value.isBlank() || UserTimeZones.isValid(value);
        }
    }
}
