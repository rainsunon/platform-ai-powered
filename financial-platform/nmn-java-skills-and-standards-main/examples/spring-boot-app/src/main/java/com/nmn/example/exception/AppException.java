package com.nmn.example.exception;

import org.springframework.http.HttpStatus;

/** Base exception for all application-specific errors. */
public abstract class AppException extends RuntimeException {

  private final HttpStatus status;
  private final String errorCode;

  protected AppException(String message, HttpStatus status, String errorCode) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }

  public HttpStatus getStatus() {
    return status;
  }

  public String getErrorCode() {
    return errorCode;
  }
}
