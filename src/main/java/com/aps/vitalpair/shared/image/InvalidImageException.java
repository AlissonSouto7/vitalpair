package com.aps.vitalpair.shared.image;

import com.aps.vitalpair.shared.exception.BusinessRuleException;

/**
 * The uploaded bytes are not an image this application will store.
 *
 * <p>Carries a message written for the person, because every one of these is something they can
 * fix by sending a different file. Extends {@link BusinessRuleException} so it answers 422: the
 * request was well formed and the server is fine, the content is the problem. A subclass of
 * {@code DomainException} directly would have fallen through to the catch-all handler and
 * surfaced as a 500, which would blame the server for a file the caller chose.
 *
 * <p>Deliberately vague about which check failed. "Formato não aceito" is all the person needs,
 * and naming the exact rule would tell someone probing the endpoint which defence they just hit.
 */
public class InvalidImageException extends BusinessRuleException {

    public InvalidImageException(String message) {
        super(message);
    }
}
