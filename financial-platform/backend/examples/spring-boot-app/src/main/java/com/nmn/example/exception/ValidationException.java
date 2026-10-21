package com.nmn.example.exception;

import org.springframework.http.HttpStatus;

public class ValidationException extends AppException {

  public ValidationException(String field, String message) {
    super(field + ": " + message, HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR");
  }

  public ValidationException(String message) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR");
  }
}
