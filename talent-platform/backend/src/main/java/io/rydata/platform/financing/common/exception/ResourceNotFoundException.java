package io.rydata.platform.financing.common.exception;

import org.springframework.http.HttpStatus;

public final class ResourceNotFoundException extends DomainException {

    public ResourceNotFoundException(String errorCode, String message) {
        super(errorCode, HttpStatus.NOT_FOUND, message);
    }
}
