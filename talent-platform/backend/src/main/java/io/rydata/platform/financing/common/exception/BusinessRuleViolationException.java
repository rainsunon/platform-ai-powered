package io.rydata.platform.financing.common.exception;

import org.springframework.http.HttpStatus;

public final class BusinessRuleViolationException extends DomainException {

    public BusinessRuleViolationException(String errorCode, String message) {
        super(errorCode, HttpStatus.UNPROCESSABLE_CONTENT, message);
    }
}
