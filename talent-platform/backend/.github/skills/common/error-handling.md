# Error Handling — Enterprise Standard

**Applies to:** All Spring Boot projects.
**Authority:** Effective Java (Bloch, 3rd ed.), Spring Framework exception handling, OWASP error handling guidelines.

---

## SECTION 1 — ERROR PHILOSOPHY

Java uses **exceptions** as the error signalling mechanism. There are three legitimate ways to fail:

| Failure type | Mechanism | Example |
|---|---|---|
| **Expected, recoverable** | Checked or unchecked exception, caught at the boundary | `ResourceNotFoundException` → 404 |
| **Programmer bug, unrecoverable** | `throw new IllegalStateException` / let it propagate | null where contract forbids it |
| **Process must exit** | Log + `System.exit(1)` — **only in `main()` / startup** | missing required config at boot |

**Never:**
- Swallow exceptions with an empty `catch` block.
- Use `Exception.getMessage()` string matching to test for specific error types.
- Catch `Throwable` or `Error` — these indicate JVM-level failure.
- Use exceptions for normal control flow — they are expensive and misleading.

---

## SECTION 2 — EXCEPTION HIERARCHY vs TYPED EXCEPTIONS vs OPAQUE EXCEPTIONS

### 2.1 Typed Domain Exceptions — testable with `instanceof` / `catch`

Use when callers need to test "is this *that* specific error?" and structured detail is needed.
All domain exceptions extend a common `AppException` base so the `GlobalExceptionHandler`
can map them to HTTP status codes in one place.

```java
// exception/AppException.java — base for all domain exceptions
package com.nmn.demo.exception;

import org.springframework.http.HttpStatus;

/**
 * Base class for all application domain exceptions.
 * Carry an HttpStatus so the GlobalExceptionHandler can map in one place.
 */
public class AppException extends RuntimeException {

  private final HttpStatus status;
  private final String     errorCode;   // machine-readable: "NOT_FOUND", "CONFLICT"

  public AppException(String message, HttpStatus status, String errorCode) {
    super(message);
    this.status    = status;
    this.errorCode = errorCode;
  }

  public AppException(String message, HttpStatus status, String errorCode, Throwable cause) {
    super(message, cause);
    this.status    = status;
    this.errorCode = errorCode;
  }

  public HttpStatus getStatus()    { return status; }
  public String     getErrorCode() { return errorCode; }
}
```

```java
// exception/ResourceNotFoundException.java
public class ResourceNotFoundException extends AppException {
  public ResourceNotFoundException(String message) {
    super(message, HttpStatus.NOT_FOUND, "NOT_FOUND");
  }
}

// exception/ValidationException.java
public class ValidationException extends AppException {
  private final String field;

  public ValidationException(String field, String message) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR");
    this.field = field;
  }

  public String getField() { return field; }
}

// exception/ConflictException.java
public class ConflictException extends AppException {
  public ConflictException(String message) {
    super(message, HttpStatus.CONFLICT, "CONFLICT");
  }
}

// exception/ForbiddenException.java
public class ForbiddenException extends AppException {
  public ForbiddenException(String message) {
    super(message, HttpStatus.FORBIDDEN, "FORBIDDEN");
  }
}

// exception/UnauthorizedException.java
public class UnauthorizedException extends AppException {
  public UnauthorizedException(String message) {
    super(message, HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED");
  }
}

// exception/RateLimitedException.java
public class RateLimitedException extends AppException {
  private final int retryAfterSeconds;

  public RateLimitedException(int retryAfterSeconds) {
    super("Rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED");
    this.retryAfterSeconds = retryAfterSeconds;
  }

  public int getRetryAfterSeconds() { return retryAfterSeconds; }
}

// exception/ExternalServiceException.java
public class ExternalServiceException extends AppException {
  public ExternalServiceException(String message, Throwable cause) {
    super(message, HttpStatus.BAD_GATEWAY, "EXTERNAL_SERVICE_ERROR", cause);
  }
}
```

### 2.2 Factory Methods — for consistent construction

```java
// exception/Errors.java — static factories
public final class Errors {
  private Errors() {}

  public static ResourceNotFoundException notFound(String resource, Object id) {
    return new ResourceNotFoundException(resource + " '" + id + "' not found");
  }

  public static ValidationException validation(String field, String message) {
    return new ValidationException(field, message);
  }

  public static ConflictException conflict(String message) {
    return new ConflictException(message);
  }

  public static ForbiddenException forbidden(String message) {
    return new ForbiddenException(message);
  }

  public static ExternalServiceException external(String message, Throwable cause) {
    return new ExternalServiceException(message, cause);
  }
}

// Usage:
throw Errors.notFound("Order", id);
throw Errors.validation("email", "Email is required");
throw Errors.conflict("Email already in use");
```

### 2.3 Opaque Exceptions — default

If a caller does not need to branch on the type, throw the most specific `AppException` subclass
with a clear message. This is the most common case.

```java
// CORRECT — wrap external cause with context
try {
  orderRepository.save(order);
} catch (DataIntegrityViolationException ex) {
  throw new ConflictException("Order with reference '" + order.getRef() + "' already exists");
}
```

---

## SECTION 3 — WRAPPING & CAUSE CHAINS

### 3.1 Always pass the cause — never drop it

```java
// CORRECT — preserves the cause chain for logging + diagnosis
try {
  paymentGateway.charge(card, amount);
} catch (GatewayException ex) {
  throw new ExternalServiceException("Payment gateway failed", ex); // cause preserved
}

// WRONG — drops the cause; root error lost forever
catch (GatewayException ex) {
  throw new ExternalServiceException("Payment gateway failed", null); // WRONG

// WRONG — wraps in a new RuntimeException, losing type information
catch (GatewayException ex) {
  throw new RuntimeException("Payment gateway failed"); // WRONG — use typed exception
}
```

### 3.2 Add context at every layer

Each layer adds what it knows. The log chain at the boundary is a breadcrumb trail.

```java
// repository layer — wrap DB exceptions as domain errors
public Order findById(Long id) {
  return orderRepository.findById(id)
      .orElseThrow(() -> Errors.notFound("Order", id));
}

// service layer — wrap repository exceptions with business context
public OrderResponse getOrder(Long orderId, Long requestingUserId) {
  Order order = orderRepository.findById(orderId); // throws ResourceNotFoundException
  if (!order.getUserId().equals(requestingUserId)) {
    throw Errors.forbidden("You can only view your own orders");
  }
  return mapper.toResponse(order);
}

// handler layer — GlobalExceptionHandler logs once and maps to HTTP
// (see Section 4 — no try/catch in controllers)
```

### 3.3 Aggregating multiple errors

For batch processing or concurrent validation, collect all errors before throwing:

```java
// Collect all validation failures before throwing (better UX than fail-fast)
public void validateOrder(OrderRequest request) {
  List<ValidationException> violations = new ArrayList<>();

  if (request.items() == null || request.items().isEmpty())
    violations.add(new ValidationException("items", "Order must have at least one item"));

  if (request.customerId() == null)
    violations.add(new ValidationException("customerId", "Customer ID is required"));

  request.items().forEach(item -> {
    if (item.quantity() <= 0)
      violations.add(new ValidationException(
          "items[].quantity", "Quantity must be positive"));
  });

  if (!violations.isEmpty()) {
    throw new MultiValidationException(violations); // see Section 4
  }
}
```

---

## SECTION 4 — DOMAIN ERROR HIERARCHY & HTTP MAPPING

All HTTP status mapping lives in **one place**: `GlobalExceptionHandler`.
Controllers never contain try/catch. Services never import `HttpStatus`.

```java
// exception/GlobalExceptionHandler.java
package com.nmn.demo.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

  // ── Domain exceptions (AppException subclasses) ───────────────────────────

  @ExceptionHandler(AppException.class)
  public ResponseEntity<ApiErrorResponse> handleApp(
      AppException ex, HttpServletRequest req) {
    log.warn("Domain error [{}] {}: {}", ex.getStatus(), ex.getErrorCode(), ex.getMessage());
    return buildResponse(ex, req, null);
  }

  // ── Bean Validation (@Valid on @RequestBody) ───────────────────────────────

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiErrorResponse> handleValidation(
      MethodArgumentNotValidException ex, HttpServletRequest req) {

    List<ApiErrorResponse.FieldViolation> violations = ex.getBindingResult()
        .getFieldErrors().stream()
        .map(e -> new ApiErrorResponse.FieldViolation(e.getField(), e.getDefaultMessage()))
        .toList();

    ApiErrorResponse body = new ApiErrorResponse(
        422, "VALIDATION_ERROR", "Request validation failed.",
        req.getRequestURI(), Instant.now(), MDC.get("requestId"), violations
    );
    return ResponseEntity.unprocessableEntity().body(body);
  }

  // ── Aggregated validation (multi-field) ───────────────────────────────────

  @ExceptionHandler(MultiValidationException.class)
  public ResponseEntity<ApiErrorResponse> handleMultiValidation(
      MultiValidationException ex, HttpServletRequest req) {

    List<ApiErrorResponse.FieldViolation> violations = ex.getViolations().stream()
        .map(v -> new ApiErrorResponse.FieldViolation(v.getField(), v.getMessage()))
        .toList();

    ApiErrorResponse body = new ApiErrorResponse(
        422, "VALIDATION_ERROR", "Request validation failed.",
        req.getRequestURI(), Instant.now(), MDC.get("requestId"), violations
    );
    return ResponseEntity.unprocessableEntity().body(body);
  }

  // ── Rate limiting ──────────────────────────────────────────────────────────

  @ExceptionHandler(RateLimitedException.class)
  public ResponseEntity<ApiErrorResponse> handleRateLimited(
      RateLimitedException ex, HttpServletRequest req,
      jakarta.servlet.http.HttpServletResponse res) {
    res.setHeader("Retry-After", String.valueOf(ex.getRetryAfterSeconds()));
    return buildResponse(ex, req, null);
  }

  // ── Catch-all — unexpected exceptions ─────────────────────────────────────

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiErrorResponse> handleGeneric(
      Exception ex, HttpServletRequest req) {
    log.error("Unexpected error on {} {}", req.getMethod(), req.getRequestURI(), ex);
    ApiErrorResponse body = new ApiErrorResponse(
        500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred.",
        req.getRequestURI(), Instant.now(), MDC.get("requestId"), null
    );
    return ResponseEntity.internalServerError().body(body);
  }

  // ── private ───────────────────────────────────────────────────────────────

  private ResponseEntity<ApiErrorResponse> buildResponse(
      AppException ex, HttpServletRequest req,
      List<ApiErrorResponse.FieldViolation> violations) {

    ApiErrorResponse body = new ApiErrorResponse(
        ex.getStatus().value(),
        ex.getErrorCode(),
        ex.getMessage(),
        req.getRequestURI(),
        Instant.now(),
        MDC.get("requestId"),
        violations
    );
    return ResponseEntity.status(ex.getStatus()).body(body);
  }
}
```

### HTTP mapping table

| Exception | HTTP status | errorCode |
|-----------|------------|-----------|
| `ResourceNotFoundException` | 404 | `NOT_FOUND` |
| `ValidationException` | 422 | `VALIDATION_ERROR` |
| `MethodArgumentNotValidException` | 422 | `VALIDATION_ERROR` |
| `UnauthorizedException` | 401 | `UNAUTHENTICATED` |
| `ForbiddenException` | 403 | `FORBIDDEN` |
| `ConflictException` | 409 | `CONFLICT` |
| `RateLimitedException` | 429 | `RATE_LIMITED` |
| `ExternalServiceException` | 502 | `EXTERNAL_SERVICE_ERROR` |
| `Exception` (catch-all) | 500 | `INTERNAL_SERVER_ERROR` |

---

## SECTION 5 — WHERE EXCEPTIONS ARE THROWN AND CAUGHT

### 5.1 Golden rule: services throw domain exceptions; handlers map to HTTP

```java
// CORRECT — service knows nothing about HTTP
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

  private final OrderRepository orderRepository;

  @Override
  public OrderResponse findById(Long orderId, Long requestingUserId) {
    Order order = orderRepository.findById(orderId)
        .orElseThrow(() -> Errors.notFound("Order", orderId));  // domain exception

    if (!order.getUserId().equals(requestingUserId)) {
      throw Errors.forbidden("You can only view your own orders"); // domain exception
    }
    return mapper.toResponse(order);
  }
}

// WRONG — service importing and using HTTP types
@Override
public ResponseEntity<OrderResponse> findById(Long id) {
  // WRONG — service is coupled to HTTP; untestable without MockMvc
  return ResponseEntity.notFound().build();
}
```

### 5.2 Repository layer — wrap DB exceptions as domain errors

```java
// repository/impl/UserRepositoryCustomImpl.java
@Repository
@RequiredArgsConstructor
public class UserRepositoryCustomImpl implements UserRepositoryCustom {

  private final EntityManager em;

  @Override
  public User create(User user) {
    try {
      em.persist(user);
      em.flush();
      return user;
    } catch (DataIntegrityViolationException ex) {
      // PostgreSQL unique constraint violation
      if (isDuplicateEmail(ex)) {
        throw new ConflictException("Email already in use: " + user.getEmail());
      }
      throw new AppException(
          "Failed to persist user", HttpStatus.INTERNAL_SERVER_ERROR,
          "DATA_INTEGRITY_ERROR", ex);
    }
  }

  private boolean isDuplicateEmail(DataIntegrityViolationException ex) {
    String msg = ex.getMostSpecificCause().getMessage();
    return msg != null && msg.contains("uq_users_email");  // constraint name, not message string
  }
}
```

---

## SECTION 6 — EXCEPTION CHECKING DISCIPLINE

### 6.1 Never swallow exceptions silently

```java
// CORRECT
try {
  return objectMapper.readValue(json, OrderRequest.class);
} catch (JsonProcessingException ex) {
  throw new ValidationException("body", "Invalid JSON: " + ex.getOriginalMessage());
}

// WRONG — explicit discard requires justification
try {
  metrics.publish(event);
} catch (Exception ex) { }  // CRITICAL — silent failure hides monitoring gaps

// If you genuinely want to ignore, add a comment and log at WARN minimum
try {
  metrics.publish(event);
} catch (Exception ex) {
  log.warn("Metric publish failed (non-fatal): event={}", event.getType(), ex);
  // best-effort — metric failure must not affect the business operation
}
```

### 6.2 Don't repeat error info in logs and rethrows

```java
// WRONG — logged at every layer; final log has 5 copies of the same error
public Order findById(Long id) {
  try {
    return orderRepository.findById(id).orElseThrow();
  } catch (Exception ex) {
    log.error("findById failed: {}", id, ex);  // WRONG — log here AND rethrow
    throw new ResourceNotFoundException("Order not found: " + id);
  }
}

// CORRECT — inner layers throw; GlobalExceptionHandler logs once at the boundary
public Order findById(Long id) {
  return orderRepository.findById(id)
      .orElseThrow(() -> Errors.notFound("Order", id));  // throw, don't log here
}
// GlobalExceptionHandler logs at warn/error level once — no duplication
```

### 6.3 No bare `new RuntimeException("...")` for domain errors

```java
// WRONG — untyped, unloggable, unmappable to HTTP
throw new RuntimeException("something failed");
throw new RuntimeException("validation: email is required"); // string match? brittle

// CORRECT — use typed domain exception
throw Errors.validation("email", "Email is required");
throw Errors.notFound("User", userId);
```

---

## SECTION 7 — ERROR RESPONSE SHAPE

All HTTP APIs return errors in exactly this shape — no exceptions.

```java
// exception/ApiErrorResponse.java
public record ApiErrorResponse(
    int       status,
    String    errorCode,   // machine-readable: "NOT_FOUND", "VALIDATION_ERROR"
    String    message,     // human-readable
    String    path,
    Instant   timestamp,
    String    requestId,   // from MDC — correlates with distributed traces
    List<FieldViolation> fieldViolations  // null for non-validation errors
) {
  public record FieldViolation(String field, String message) {}
}
```

Single error:
```json
{
  "status": 404,
  "errorCode": "NOT_FOUND",
  "message": "Order '42' not found",
  "path": "/api/v1/orders/42",
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "fieldViolations": null
}
```

Validation error with multiple field violations:
```json
{
  "status": 422,
  "errorCode": "VALIDATION_ERROR",
  "message": "Request validation failed.",
  "path": "/api/v1/orders",
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "fieldViolations": [
    { "field": "email",    "message": "Invalid email format." },
    { "field": "quantity", "message": "Must be at least 1."  }
  ]
}
```

---

## SECTION 8 — UNRECOVERABLE ERRORS: ERROR vs ASSERTION

In Java, unrecoverable programmer errors are expressed through unchecked exceptions
and assertions rather than a dedicated panic mechanism.

### 8.1 When `IllegalStateException` / `AssertionError` is acceptable

- Inside a class, for invariants the class itself violates if breached.
- In factory methods for compile-time-verified preconditions.
- In `enum` switch to signal impossible state.

```java
// Acceptable — internal invariant; reaching default means a programmer bug
public OrderStatus nextStatus(OrderStatus current) {
  return switch (current) {
    case PENDING   -> OrderStatus.CONFIRMED;
    case CONFIRMED -> OrderStatus.SHIPPED;
    case SHIPPED   -> OrderStatus.DELIVERED;
    default -> throw new IllegalStateException(
        "Unexpected terminal status: " + current);  // programmer bug
  };
}
```

### 8.2 Catch-all exception handler — `@ExceptionHandler(Exception.class)`

The catch-all handler in `GlobalExceptionHandler` ensures that any uncaught exception
is intercepted at the framework level, preventing unformatted 500 responses or
stack trace leaks from reaching the client.

```java
// In GlobalExceptionHandler — catches everything that slips through typed handlers
@ExceptionHandler(Exception.class)
public ResponseEntity<ApiErrorResponse> handleGeneric(Exception ex, HttpServletRequest req) {
  log.error("Unexpected error on {} {}", req.getMethod(), req.getRequestURI(), ex);
  // NEVER expose ex.getMessage() or stack trace in the response body
  return ResponseEntity.internalServerError().body(new ApiErrorResponse(
      500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred.",
      req.getRequestURI(), Instant.now(), MDC.get("requestId"), null
  ));
}
```

### 8.3 Never catch-and-continue hiding bugs

```java
// WRONG — swallows a crash and continues with corrupted state
try {
  dangerousThing();
} catch (Exception ex) {
  // ignored
}

// A caught exception indicates something went wrong.
// Either handle it properly or let it propagate to the boundary handler.
```

---

## SECTION 9 — ANTI-PATTERNS REFERENCE

```java
// 1. Silent swallow — the worst pattern
try { repo.update(order); } catch (Exception ex) { }  // CRITICAL

// 2. String-matching exception messages — brittle, DB-vendor-specific
if (ex.getMessage().contains("duplicate")) { ... }
// CORRECT: catch DataIntegrityViolationException and check constraint name

// 3. Returning null instead of throwing
public Order findById(Long id) {
  return orderRepository.findById(id).orElse(null); // WRONG — forces null-checks on callers
}
// CORRECT: throw Errors.notFound("Order", id)

// 4. Catching and rethrowing without cause
catch (GatewayException ex) {
  throw new ExternalServiceException("failed", null); // WRONG — null cause loses root error
}
// CORRECT: throw new ExternalServiceException("failed", ex)

// 5. Using exceptions for normal control flow
try {
  return Integer.parseInt(value);
} catch (NumberFormatException ex) {
  return 0; // WRONG — use StringUtils.isNumeric() check first; exceptions are expensive
}

// 6. Logging at every layer — multiplied noise
// RULE: THROW at inner layers. LOG ONCE in GlobalExceptionHandler at the boundary.

// 7. Catching Exception in service or repository layer
catch (Exception ex) {
  log.error("error", ex);
  return null;             // WRONG — swallow + return null = double anti-pattern
}

// 8. instanceof to discriminate exceptions — use typed catch instead
catch (AppException ex) {
  if (ex instanceof ResourceNotFoundException) { ... }  // WRONG — use a separate catch block
}
// CORRECT:
catch (ResourceNotFoundException ex) { ... }
catch (ConflictException ex) { ... }

// 9. Throwing checked exceptions from service methods
// Spring's @Transactional only rolls back on RuntimeException by default.
// Always use unchecked (RuntimeException) subclasses in service layer.
public void create(OrderRequest req) throws IOException { ... }  // WRONG — checked exception
public void create(OrderRequest req) { ... }                     // CORRECT — unchecked only

// 10. Exposing stack traces in API responses
return ResponseEntity.internalServerError()
    .body(Map.of("error", ex.getMessage()));  // WRONG — may leak internal paths, class names
// CORRECT: use ApiErrorResponse with a generic "An unexpected error occurred." message
```
