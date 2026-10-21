package io.rydata.platform.financing.common.exception;

import org.springframework.http.HttpStatus;

public final class ConflictException extends DomainException {

    public ConflictException(String errorCode, String message) {
        super(errorCode, HttpStatus.CONFLICT, message);
    }
}
