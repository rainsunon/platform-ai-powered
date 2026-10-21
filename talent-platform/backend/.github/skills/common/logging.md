# Logging — Enterprise Standard

**Applies to:** All Spring Boot projects in all deployment environments.
**No `System.out.println` or `java.util.logging` in production code. Ever.**

---

## SECTION 1 — LIBRARY CHOICE AND RATIONALE

Use **SLF4J + Logback** (bundled with `spring-boot-starter-web`) for all application logging.
It provides:

- Structured key-value output (JSON for prod via `logstash-logback-encoder`, text for dev).
- Context-aware logging via **MDC** (Mapped Diagnostic Context) — thread-local key-value store.
- Pluggable backends — swap Logback for Log4j2 without changing any application code.
- Levels: `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`.
- Zero allocations for disabled levels via SLF4J's `{}` placeholder syntax.

Use `@Slf4j` (Lombok) on every class that logs — eliminates the boilerplate
`private static final Logger log = LoggerFactory.getLogger(...)`.

```xml
<!-- Already included via spring-boot-starter — no extra dependency needed -->
<!-- For JSON output in production, add: -->
<dependency>
  <groupId>net.logstash.logback</groupId>
  <artifactId>logstash-logback-encoder</artifactId>
  <version>7.4</version>
</dependency>
```

**When to use `System.out`:** Never in application code.
Acceptable only in a standalone `public static void main` diagnostic script.

---

## SECTION 2 — CONFIGURATION

```xml
<!-- src/main/resources/logback-spring.xml -->
<configuration>

  <!-- ── Production profile: JSON to stdout ──────────────────────────────── -->
  <springProfile name="!local">
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
      <encoder class="net.logstash.logback.encoder.LogstashEncoder">
        <!-- Include MDC fields in every log line -->
        <includeMdcKeyName>requestId</includeMdcKeyName>
        <includeMdcKeyName>userId</includeMdcKeyName>
        <includeMdcKeyName>tenantId</includeMdcKeyName>
        <includeMdcKeyName>traceId</includeMdcKeyName>
        <includeMdcKeyName>spanId</includeMdcKeyName>
        <!-- Shorten stack traces — root cause first -->
        <throwableConverter class="net.logstash.logback.stacktrace.ShortenedThrowableConverter">
          <maxDepthPerCause>10</maxDepthPerCause>
          <rootCauseFirst>true</rootCauseFirst>
        </throwableConverter>
      </encoder>
    </appender>

    <root level="WARN">
      <appender-ref ref="STDOUT"/>
    </root>
    <logger name="com.nmn" level="INFO" additivity="false">
      <appender-ref ref="STDOUT"/>
    </logger>
  </springProfile>

  <!-- ── Local profile: human-readable coloured output ───────────────────── -->
  <springProfile name="local">
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
      <encoder>
        <pattern>
          %clr(%d{HH:mm:ss.SSS}){faint} %clr(%-5level) %clr(%logger{36}){cyan}
          %clr([%X{requestId:-no-request-id}]){faint} - %msg%n
        </pattern>
      </encoder>
    </appender>

    <root level="INFO">
      <appender-ref ref="STDOUT"/>
    </root>
    <logger name="com.nmn" level="DEBUG" additivity="false">
      <appender-ref ref="STDOUT"/>
    </logger>
    <logger name="org.hibernate.SQL" level="DEBUG" additivity="false">
      <appender-ref ref="STDOUT"/>
    </logger>
  </springProfile>

</configuration>
```

```yaml
# application.yml — level overrides (logback-spring.xml is the primary config)
logging:
  level:
    root: WARN
    com.nmn: INFO
    org.springframework.web: WARN
    org.hibernate.SQL: WARN        # set to DEBUG in local profile only
```

---

## SECTION 3 — GETTING A LOGGER

Use `@Slf4j` (Lombok) on every class. Never instantiate `LoggerFactory` manually.

```java
// CORRECT — @Slf4j generates: private static final Logger log = LoggerFactory.getLogger(...)
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

  private final OrderRepository orderRepository;

  @Override
  public OrderResponse create(OrderRequest request) {
    log.info("Creating order: customerId={}", request.customerId());
    Order saved = orderRepository.save(orderMapper.toEntity(request));
    log.debug("Order persisted: id={}", saved.getId());
    return orderMapper.toResponse(saved);
  }
}

// WRONG — manual logger declaration (verbose, error-prone class name)
private static final Logger log = LoggerFactory.getLogger(OrderServiceImpl.class);

// WRONG — using System.out
System.out.println("Creating order: " + request.customerId()); // CRITICAL
```

---

## SECTION 4 — LOG LEVELS — WHEN TO USE EACH

| Level | Use when | Examples |
|-------|----------|---------|
| `TRACE` | Very detailed — off in all environments except local debugging | SQL bind parameters, loop iterations |
| `DEBUG` | Detailed trace for debugging. Off in production. | Query parameters, intermediate values |
| `INFO` | Normal operational events. Default production level. | Order created, user registered, job completed |
| `WARN` | Unexpected but recoverable. Ops should know. | Retry triggered, fallback used, deprecated API hit |
| `ERROR` | Failure affecting a user or operation. | Payment failed, DB unreachable, file missing |

There is no `FATAL` in SLF4J — for unrecoverable startup errors, log at `ERROR`
then let Spring Boot exit (or call `System.exit(1)` in `main()` only).

```java
// DEBUG — only useful when diagnosing a specific issue
log.debug("Cache lookup: key={} hit={} ttlSeconds={}",
    cacheKey, result != null, ttl);

// INFO — confirms healthy operation
log.info("Order created: orderId={} customerId={} tenantId={} itemCount={}",
    order.getId(), order.getCustomerId(), tenantId, order.getItems().size());

// WARN — unusual but handled
log.warn("Retry attempt: service={} attempt={} maxAttempts={} error={}",
    "payment-gateway", attempt, maxRetries, ex.getMessage());

// ERROR — something failed; always include the exception as last arg
log.error("Payment failed: orderId={} userId={} gatewayStatus={}",
    orderId, userId, response.getStatusCode(), ex);  // ex as last arg = full stack trace

// Startup-critical — log then exit; main() only
log.error("Database unreachable at startup: host={}", host, ex);
System.exit(1);
```

---

## SECTION 5 — STRUCTURED FIELDS — CONSISTENCY ACROSS THOUSANDS OF LOGS

All log entries for a given event type must use **identical field names**.
Inconsistent fields make log aggregation and alerting impossible.

### 5.1 Standard Field Vocabulary

| Field | Type | Description |
|-------|------|-------------|
| `requestId` | string (UUID) | Trace ID — set in MDC at filter, propagated automatically |
| `traceId` | string (32-hex) | OpenTelemetry trace ID |
| `spanId` | string (16-hex) | OpenTelemetry span ID |
| `userId` | long / string | Authenticated user performing the action |
| `tenantId` | long / string | Tenant in a multi-tenant system |
| `sessionId` | string | User session identifier |
| `entity` | string | Entity type: `"User"`, `"Order"` |
| `entityId` | long / string | Entity primary key |
| `action` | string | What happened: `"created"`, `"updated"`, `"deleted"` |
| `durationMs` | long | Operation duration in milliseconds |
| `httpMethod` | string | HTTP method: `"GET"`, `"POST"` |
| `httpPath` | string | Request path |
| `httpStatus` | int | Response status code |
| `service` | string | External service name when calling third parties |
| `errorCode` | string | Machine-readable error code |

```java
// CORRECT — structured, consistent, searchable
log.info("Order created: entity={} entityId={} userId={} tenantId={} totalAmount={} itemCount={} durationMs={}",
    "Order", order.getId(), currentUserId, tenantId,
    order.getTotal(), order.getItems().size(),
    System.currentTimeMillis() - startTime);

// WRONG — unstructured string; impossible to query in Kibana / CloudWatch
log.info("Order " + order.getId() + " created by user " + currentUserId
    + " for " + order.getTotal());  // WRONG — string concat + unqueryable
```

### 5.2 Event Naming Convention

```
Pattern:  {entity}_{action}_{modifier}
Examples:
  order_created
  user_login_failed
  payment_processed
  cache_lookup_hit
  cache_lookup_miss
  retry_attempt_succeeded
  rate_limit_exceeded
  db_query_slow              ← paired with durationMs field
```

---

## SECTION 6 — MDC — REQUEST-SCOPED CONTEXT BINDING

MDC (Mapped Diagnostic Context) is SLF4J's thread-local key-value store.
Set it once in a filter — every log line in that request automatically includes those fields.

```java
// filter/MdcLoggingFilter.java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class MdcLoggingFilter extends OncePerRequestFilter {

  @Override
  protected void doFilterInternal(HttpServletRequest req,
      HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {

    long startTime = System.currentTimeMillis();

    // Extract or generate request ID
    String requestId = Optional.ofNullable(req.getHeader("X-Request-ID"))
        .orElse(UUID.randomUUID().toString());

    // Bind to MDC — available on every log line in this thread
    MDC.put("requestId", requestId);
    MDC.put("httpMethod", req.getMethod());
    MDC.put("httpPath",   req.getRequestURI());

    res.setHeader("X-Request-ID", requestId);

    log.info("request_received");

    try {
      chain.doFilter(req, res);
    } finally {
      log.info("request_completed: httpStatus={} durationMs={}",
          res.getStatus(),
          System.currentTimeMillis() - startTime);

      MDC.clear(); // CRITICAL — always clear; thread pool reuse will bleed MDC into next request
    }
  }
}

// After authentication succeeds — bind user context to MDC
// Call this from your JwtAuthenticationFilter after validating the token:
public static void bindUser(Long userId, Long tenantId) {
  MDC.put("userId",   userId.toString());
  MDC.put("tenantId", tenantId.toString());
}
```

---

## SECTION 7 — LOGGING ERRORS

```java
// CORRECT — log at the boundary (GlobalExceptionHandler) with full context
// Inner service layers: throw, don't log
// GlobalExceptionHandler: log once with full context

@ExceptionHandler(AppException.class)
public ResponseEntity<ApiErrorResponse> handleApp(AppException ex, HttpServletRequest req) {
  // WARN for expected domain errors (404, 409, 400)
  log.warn("Domain error: errorCode={} path={} message={}",
      ex.getErrorCode(), req.getRequestURI(), ex.getMessage());
  return buildResponse(ex, req, null);
}

@ExceptionHandler(Exception.class)
public ResponseEntity<ApiErrorResponse> handleGeneric(Exception ex, HttpServletRequest req) {
  // ERROR for unexpected errors — pass ex as last arg for full stack trace
  log.error("Unexpected error: method={} path={}",
      req.getMethod(), req.getRequestURI(), ex);
  return ResponseEntity.internalServerError().body(...);
}

// CORRECT — WARN level for retryable failures
for (int attempt = 0; attempt < maxRetries; attempt++) {
  try {
    return callExternalService();
  } catch (ExternalServiceException ex) {
    log.warn("Retry attempt: service={} attempt={} maxAttempts={} error={}",
        "payment-gateway", attempt + 1, maxRetries, ex.getMessage());
    Thread.sleep(backoff(attempt));
  }
}

// WRONG — logging at every layer (duplicated noise in prod)
public Order findById(Long id) {
  try {
    return orderRepository.findById(id).orElseThrow();
  } catch (Exception ex) {
    log.error("findById failed", ex);  // WRONG — log here AND in GlobalExceptionHandler
    throw new ResourceNotFoundException("Order not found: " + id);
  }
}
// CORRECT: just throw — GlobalExceptionHandler logs once at the boundary

// WRONG — string concatenation in log args (allocates even when level disabled)
log.debug("Processing order: " + order.getId() + " for " + order.getCustomerId()); // WRONG

// CORRECT — SLF4J {} placeholders (deferred evaluation — no allocation if DEBUG disabled)
log.debug("Processing order: orderId={} customerId={}", order.getId(), order.getCustomerId());
```

---

## SECTION 8 — WHAT NEVER TO LOG

Security requirements — violations cause compliance incidents.

| Never log | Reason | Alternative |
|-----------|--------|-------------|
| Passwords, secret keys, API tokens | Credentials in logs = breach | Log that auth occurred, not the credential |
| Full credit card numbers | PCI DSS violation | Log last 4 only: `card.substring(card.length() - 4)` |
| Full SSN / national ID | PII / GDPR | Log presence/absence only |
| JWT token value | Token is a credential | Log `tokenType` only |
| Email addresses in body | GDPR minimisation | Log `userId` instead |
| Full request body | May contain PII or credentials | Log specific safe fields only |
| Full response body from external APIs | May leak sensitive data + bloat | Log status code and duration |
| Database connection strings | Contain credentials | Log only the host portion |

```java
// WRONG — credentials in log
log.info("Connecting to DB: url={}", props.getDatabase().getUrl()); // url contains password

// CORRECT — strip credentials
String host = URI.create(props.getDatabase().getUrl()).getHost();
log.info("Connecting to DB: host={}", host);

// WRONG — full card number
log.info("Payment attempted: cardNumber={}", card.getNumber()); // PCI DSS violation

// CORRECT — last 4 only
String last4 = card.getNumber().substring(card.getNumber().length() - 4);
log.info("Payment attempted: cardLast4={}", last4);

// WRONG — logging the JWT
log.debug("Auth token: token={}", bearerToken); // credential in log

// CORRECT — log only the type
log.debug("Auth token present: type=Bearer");
```

---

## SECTION 9 — SLOW QUERY LOGGING

Instrument repository operations for slow-query detection using Spring AOP or a wrapper.

```java
// aspect/SlowQueryLoggingAspect.java
@Aspect
@Component
@Slf4j
public class SlowQueryLoggingAspect {

  private static final long SLOW_QUERY_THRESHOLD_MS = 100;

  // Intercept all Spring Data repository methods
  @Around("execution(* org.springframework.data.repository.Repository+.*(..))")
  public Object logRepositoryCall(ProceedingJoinPoint pjp) throws Throwable {
    long start  = System.currentTimeMillis();
    String op   = pjp.getSignature().getName();
    String entity = pjp.getTarget().getClass().getSimpleName()
        .replace("Repository", "");

    try {
      Object result = pjp.proceed();
      long durationMs = System.currentTimeMillis() - start;

      if (durationMs > SLOW_QUERY_THRESHOLD_MS) {
        log.warn("db_query_slow: entity={} operation={} durationMs={}",
            entity, op, durationMs);
      } else {
        log.debug("db_query_completed: entity={} operation={} durationMs={}",
            entity, op, durationMs);
      }
      return result;

    } catch (Exception ex) {
      long durationMs = System.currentTimeMillis() - start;
      log.error("db_query_failed: entity={} operation={} durationMs={}",
          entity, op, durationMs, ex);
      throw ex;
    }
  }
}
```

---

## SECTION 10 — TRACE CORRELATION (OpenTelemetry)

When using Micrometer + OpenTelemetry, inject `traceId` and `spanId` into every log line.
Spring Boot 3.x does this automatically when `micrometer-tracing-bridge-otel` is on the classpath.

```xml
<!-- pom.xml -->
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-tracing-bridge-otel</artifactId>
</dependency>
<dependency>
  <groupId>io.opentelemetry</groupId>
  <artifactId>opentelemetry-exporter-otlp</artifactId>
</dependency>
```

```yaml
# application.yml
management:
  tracing:
    sampling:
      probability: 1.0     # 100% in dev; set to 0.1 in prod
  otlp:
    tracing:
      endpoint: ${OTEL_EXPORTER_OTLP_ENDPOINT:http://localhost:4318/v1/traces}

logging:
  pattern:
    level: "%5p [${spring.application.name:},%X{traceId:-},%X{spanId:-}]"
```

Spring Boot 3.x automatically:
1. Creates a span for every incoming HTTP request
2. Puts `traceId` and `spanId` into MDC
3. `LogstashEncoder` picks them up from MDC and adds them to every JSON log line
4. Propagates trace context to downstream `RestClient` calls via `W3C TraceContext` headers

```java
// No manual trace injection needed — Spring handles it automatically.
// Every log line in a request will include:
// "traceId": "4bf92f3577b34da6a3ce929d0e0e4736"
// "spanId":  "00f067aa0ba902b7"

// For manual span creation in long operations:
@Autowired
private Tracer tracer;

public void processLargeExport(Long reportId) {
  Span span = tracer.nextSpan().name("process-large-export").start();
  try (Tracer.SpanInScope ws = tracer.withSpan(span)) {
    log.info("export_started: reportId={}", reportId); // traceId auto-included
    doExport(reportId);
    log.info("export_completed: reportId={}", reportId);
  } finally {
    span.end();
  }
}
```

See `skills/common/observability.md` for the full OTel setup.
