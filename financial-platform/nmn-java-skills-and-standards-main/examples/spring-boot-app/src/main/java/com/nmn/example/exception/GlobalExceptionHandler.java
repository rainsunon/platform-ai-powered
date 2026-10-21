package com.nmn.example.exception;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(AppException.class)
  public ResponseEntity<Map<String, Object>> handleAppException(AppException ex) {
    log.warn("Application error [{}]: {}", ex.getErrorCode(), ex.getMessage());
    return ResponseEntity.status(ex.getStatus())
        .body(errorBody(ex.getStatus().value(), ex.getErrorCode(), ex.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
    Map<String, String> fieldErrors =
        ex.getBindingResult().getFieldErrors().stream()
            .collect(
                Collectors.toMap(
                    FieldError::getField,
                    f -> f.getDefaultMessage() != null ? f.getDefaultMessage() : "Invalid value",
                    (a, b) -> a));

    log.warn("Validation failed: {}", fieldErrors);

    Map<String, Object> body =
        Map.of(
            "status", 422,
            "errorCode", "VALIDATION_ERROR",
            "message", "Request validation failed",
            "errors", fieldErrors,
            "timestamp", Instant.now().toString());

    return ResponseEntity.unprocessableEntity().body(body);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex) {
    log.error("Unexpected error", ex);
    return ResponseEntity.internalServerError()
        .body(errorBody(500, "INTERNAL_ERROR", "An unexpected error occurred"));
  }

  private Map<String, Object> errorBody(int status, String errorCode, String message) {
    return Map.of(
        "status", status,
        "errorCode", errorCode,
        "message", message,
        "timestamp", Instant.now().toString());
  }
}
