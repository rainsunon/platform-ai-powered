---
name: spring-webflux
description: |
  Generates production-ready reactive Spring WebFlux code following NMN clean
  architecture standards. Use this skill whenever the user asks for: reactive Spring Boot,
  WebFlux, R2DBC, reactive streams, Mono or Flux, non-blocking API, reactive REST
  endpoints, reactive repositories, reactive security, reactive error handling,
  RouterFunction functional endpoints, reactive Kafka consumers, reactive circuit
  breaker, reactive rate limiting, reactive testing with StepVerifier or WebTestClient,
  high-throughput or I/O-heavy microservices, event-driven reactive pipelines, or any
  task where the user explicitly says "reactive", "non-blocking", "WebFlux", or "R2DBC".
  Even if the user says "make it reactive", "convert to WebFlux", "I need non-blocking
  endpoints", or "use Project Reactor" — trigger this skill instead of spring-boot skill.
---

# Spring WebFlux Skill — NMN Standards

## When to choose WebFlux over Spring MVC

| Choose WebFlux | Choose Spring MVC |
|----------------|-------------------|
| High-concurrency I/O-heavy workloads | Standard CRUD APIs |
| Streaming responses (SSE, WebSocket) | Team unfamiliar with reactive programming |
| Event-driven pipelines | Blocking third-party libraries in the stack |
| Microservice acting as an aggregator | Simple request-reply semantics |
| Explicit non-blocking requirement | JPA / Hibernate required (use MVC + R2DBC workarounds are complex) |

**Default is Spring MVC** — only use this skill when WebFlux is explicitly requested or clearly the right fit.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 17 (records, sealed classes, text blocks, switch expressions) |
| Build | Maven 3.9+ |
| Framework | Spring Boot 3.x + Spring WebFlux |
| Reactive runtime | Project Reactor (`Mono<T>`, `Flux<T>`) |
| Persistence | Spring Data R2DBC + PostgreSQL R2DBC driver |
| Migrations | Flyway (runs on startup with blocking JDBC — separate datasource) |
| Validation | `jakarta.validation` + `spring-boot-starter-validation` |
| Security | Spring Security 6 Reactive + JWT (`jjwt`) |
| Testing | JUnit 5 + `StepVerifier` + `WebTestClient` + Testcontainers |
| Observability | Micrometer + Spring Actuator + OpenTelemetry (reactor context propagation) |
| Resilience | Resilience4j Reactor (`circuitbreaker-reactor`, `retry-reactor`) |
| API Docs | springdoc-openapi webflux |
| Code Style | `google-java-format` — 2-space indent, never tabs |
| Logging | SLF4J + `@Slf4j` + Logback + `LogstashEncoder` (MDC via reactor context) |

---

## Package structure (always use this)

```
com.nmn.{projectname}/
├── controller/               ← @RestController returning Mono<ResponseEntity<T>> / Flux<T>
│   └── router/               ← RouterFunction functional endpoints (alternative to annotations)
├── service/
│   ├── {Feature}Service.java              ← interface returning Mono<T> / Flux<T>
│   └── impl/{Feature}ServiceImpl.java     ← @Service reactive implementation
├── repository/               ← extends ReactiveCrudRepository<Entity, ID>
├── model/                    ← plain Java classes (NOT @Entity — R2DBC uses @Table)
├── dto/
│   ├── request/              ← @Valid-annotated inbound payloads
│   └── response/             ← outbound DTOs (Java records preferred)
├── mapper/                   ← entity ↔ DTO conversion (pure functions — no I/O)
├── exception/                ← AppException hierarchy + ReactiveExceptionHandler
├── config/                   ← SecurityConfig, CorsConfig, R2dbcConfig, WebClientConfig
├── filter/                   ← WebFilter subclasses (MDC via reactor context, security headers)
└── client/                   ← WebClient-based typed HTTP clients for external services
```

---

## Key differences from Spring MVC (complete reference)

| Concept | Spring MVC | Spring WebFlux |
|---------|-----------|----------------|
| Controller return type | `ResponseEntity<T>` | `Mono<ResponseEntity<T>>` |
| List return type | `ResponseEntity<List<T>>` | `Flux<T>` or `Mono<List<T>>` |
| Repository base | `JpaRepository<E, ID>` | `ReactiveCrudRepository<E, ID>` |
| Entity annotations | `@Entity` + `@Column` | `@Table` + `@Column` (R2DBC — no `@Entity`) |
| Not found | `orElseThrow(...)` | `switchIfEmpty(Mono.error(...))` |
| Absent value | `Optional<T>` | `Mono<T>` (empty = absent) |
| Blocking check | N/A | Never call `.block()` outside tests |
| `@Transactional` | Blocking JDBC | `@Transactional` with R2DBC reactive driver |
| Security context | `SecurityContextHolder` (thread-local) | `ReactiveSecurityContextHolder` (reactor context) |
| MDC logging | `MDC.put(...)` in filter | Reactor context → MDC bridge in subscriber hook |
| Validation trigger | `@Valid` on `@RequestBody` | `@Valid` on `@RequestBody` (same) |
| Error handling | `@RestControllerAdvice` | `@ControllerAdvice` + `WebExceptionHandler` |
| HTTP client | `RestClient` | `WebClient` |
| Test client | `MockMvc` | `WebTestClient` |
| Test assertion | AssertJ | `StepVerifier` + AssertJ |

---

## Hard rules — enforce on every generation

1. **Constructor injection only** — never `@Autowired` on fields; use `@RequiredArgsConstructor`
2. **DTO boundary** — model classes must never leave the service layer; always map to response DTO
3. **Service interface + impl** — always create `{Feature}Service` interface and `{Feature}ServiceImpl` in `impl/`
4. **Reactive return types** — `Mono<ResponseEntity<T>>` for single resources, `Flux<T>` for streams
5. **`BigDecimal` from String for money** — `new BigDecimal("19.99")` — never `double` or `float`
6. **`@Valid` on every `@RequestBody`** — without exception
7. **Never `.block()` in production code** — `.block()` is only acceptable in tests and startup code
8. **`switchIfEmpty(Mono.error(...))` for not-found** — never return empty `Mono` / `Flux` silently
9. **No `@Data` on R2DBC models** — use `@Getter`/`@Setter`; Lombok `@Data` breaks R2DBC mapping
10. **Audit fields on every model** — `createdAt`/`updatedAt` populated in service layer (R2DBC has no `@CreationTimestamp`)
11. **`@Slf4j` + SLF4J `{}` placeholders** — never `System.out.println`
12. **Typed `AppException` subclasses** — never catch and swallow; never throw bare `RuntimeException`
13. **`SecureRandom` for security tokens** — never `java.util.Random`
14. **Reactor context for MDC** — never use `MDC.put(...)` directly in reactive chains (wrong thread)
15. **Flyway** — schema migrations use blocking JDBC datasource at startup; never R2DBC for migrations
16. **`@PreAuthorize` at service layer** — use reactive method security, not just controller layer

---

## Generation order — follow every time

1. `model/{Entity}.java` — R2DBC model with `@Table`, `@Column`, `@Id`
2. `dto/request/{Entity}Request.java` — inbound DTO with `@Valid`
3. `dto/response/{Entity}Response.java` — outbound DTO (Java record preferred)
4. `repository/{Entity}Repository.java` — `ReactiveCrudRepository` + custom queries
5. `mapper/{Entity}Mapper.java` — pure `toModel()` and `toResponse()` methods
6. `service/{Entity}Service.java` — interface returning `Mono<T>` / `Flux<T>` with Javadoc
7. `service/impl/{Entity}ServiceImpl.java` — `@Service` reactive implementation
8. `controller/{Entity}Controller.java` — reactive REST endpoints + OpenAPI annotations
9. `exception/` — custom exception classes if new error types are needed
10. Ask user before generating tests — they may want them as a separate step

---

## Controller patterns

**Single resource:**
```java
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

  private final OrderService orderService;

  @GetMapping("/{id}")
  public Mono<ResponseEntity<OrderResponse>> findById(@PathVariable Long id) {
    return orderService.findById(id)
        .map(ResponseEntity::ok);
    // ResourceNotFoundException thrown by service → ReactiveExceptionHandler → 404
  }

  @PostMapping
  public Mono<ResponseEntity<OrderResponse>> create(
      @Valid @RequestBody OrderRequest request) {
    return orderService.create(request)
        .map(resp -> ResponseEntity.status(HttpStatus.CREATED).body(resp));
  }

  // Paginated list — R2DBC does not support Spring Page<T>; use cursor pagination
  @GetMapping
  public Mono<ResponseEntity<Map<String, Object>>> findAll(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {

    if (size < 1 || size > 100) {
      return Mono.error(new ValidationException("size", "Page size must be 1..100"));
    }
    return orderService.findAll(page, size)
        .collectList()
        .zipWith(orderService.count())
        .map(tuple -> {
          Map<String, Object> body = Map.of(
              "content", tuple.getT1(),
              "page", Map.of(
                  "number", page,
                  "size", size,
                  "totalElements", tuple.getT2()
              )
          );
          return ResponseEntity.ok(body);
        });
  }

  // Server-Sent Events streaming
  @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public Flux<OrderResponse> stream() {
    return orderService.stream();
  }
}
```

**Service pattern:**
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

  private final OrderRepository orderRepository;
  private final OrderMapper     orderMapper;

  @Override
  public Mono<OrderResponse> findById(Long id) {
    return orderRepository.findById(id)
        .map(orderMapper::toResponse)
        .switchIfEmpty(Mono.error(
            new ResourceNotFoundException("Order not found: " + id)));
  }

  @Override
  public Mono<OrderResponse> create(OrderRequest request) {
    Order order = orderMapper.toModel(request);
    order.setCreatedAt(Instant.now());
    order.setUpdatedAt(Instant.now());
    return orderRepository.save(order)
        .map(orderMapper::toResponse)
        .doOnSuccess(r -> log.info("Order created: orderId={}", r.id()));
  }

  @Override
  public Flux<OrderResponse> findAll() {
    return orderRepository.findAll()
        .map(orderMapper::toResponse);
  }
}
```

**Repository pattern:**
```java
public interface OrderRepository extends ReactiveCrudRepository<Order, Long> {

  Flux<Order> findByStatus(OrderStatus status);

  Flux<Order> findByUserId(Long userId);

  @Query("SELECT * FROM orders WHERE status = :status AND user_id = :userId")
  Flux<Order> findByStatusAndUserId(String status, Long userId);
}
```

---

## Reactive error handling

```java
// exception/ReactiveExceptionHandler.java
@Component
@Order(-2)   // higher priority than DefaultErrorWebExceptionHandler
@Slf4j
public class ReactiveExceptionHandler implements WebExceptionHandler {

  @Override
  public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
    ServerHttpResponse response = exchange.getResponse();
    response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

    ApiErrorResponse body;
    if (ex instanceof AppException appEx) {
      log.warn("Domain error: errorCode={} message={}",
          appEx.getErrorCode(), appEx.getMessage());
      response.setStatusCode(appEx.getStatus());
      body = new ApiErrorResponse(
          appEx.getStatus().value(), appEx.getErrorCode(),
          appEx.getMessage(), exchange.getRequest().getPath().value(),
          Instant.now(), null, null);
    } else {
      log.error("Unexpected error on {}",
          exchange.getRequest().getPath().value(), ex);
      response.setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
      body = new ApiErrorResponse(500, "INTERNAL_SERVER_ERROR",
          "An unexpected error occurred.",
          exchange.getRequest().getPath().value(),
          Instant.now(), null, null);
    }

    byte[] bytes = toJson(body);
    DataBuffer buffer = response.bufferFactory().wrap(bytes);
    return response.writeWith(Mono.just(buffer));
  }
}
```

---

## MDC logging in reactive chains

MDC is thread-local — it does not work directly in reactive chains because operators run on different threads. Use the Reactor context + a subscriber hook to bridge:

```java
// config/ReactorMdcConfig.java
@Configuration
public class ReactorMdcConfig {

  @PostConstruct
  public void enableMdcContextPropagation() {
    // Reactor 3.5+ — automatic MDC propagation via context propagation API
    Hooks.enableAutomaticContextPropagation();
  }
}

// filter/MdcWebFilter.java — WebFilter for reactive stack
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class MdcWebFilter implements WebFilter {

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
    String requestId = Optional
        .ofNullable(exchange.getRequest().getHeaders().getFirst("X-Request-ID"))
        .orElse(UUID.randomUUID().toString());

    exchange.getResponse().getHeaders().set("X-Request-ID", requestId);

    return chain.filter(exchange)
        .contextWrite(Context.of(
            "requestId", requestId,
            "httpMethod", exchange.getRequest().getMethod().name(),
            "httpPath",   exchange.getRequest().getPath().value()
        ));
  }
}
```

---

## Reactive security

```java
// config/ReactiveSecurityConfig.java
@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
@RequiredArgsConstructor
public class ReactiveSecurityConfig {

  private final ReactiveJwtAuthenticationFilter jwtFilter;

  @Bean
  public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
    return http
        .csrf(ServerHttpSecurity.CsrfSpec::disable)
        .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
        .authorizeExchange(auth -> auth
            .pathMatchers("/api/v1/auth/**", "/actuator/health/**").permitAll()
            .anyExchange().authenticated()
        )
        .addFilterAt(jwtFilter, SecurityWebFiltersOrder.AUTHENTICATION)
        .build();
  }
}

// Reactive security context in service layer
public Mono<OrderResponse> findMyOrder(Long orderId) {
  return ReactiveSecurityContextHolder.getContext()
      .map(ctx -> (UserDetails) ctx.getAuthentication().getPrincipal())
      .flatMap(user -> orderRepository.findById(orderId)
          .switchIfEmpty(Mono.error(new ResourceNotFoundException("Order not found: " + orderId)))
          .flatMap(order -> {
            if (!order.getUserId().equals(Long.parseLong(user.getUsername())))
              return Mono.error(new ForbiddenException("You can only view your own orders"));
            return Mono.just(orderMapper.toResponse(order));
          }));
}
```

---

## Reactive testing

```java
// controller/OrderControllerTest.java — WebTestClient for controller slice
@WebFluxTest(OrderController.class)
class OrderControllerTest {

  @Autowired  private WebTestClient webTestClient;
  @MockBean   private OrderService  orderService;

  @Test
  void findById_whenExists_returns200() {
    OrderResponse resp = new OrderResponse(1L, "PENDING", new BigDecimal("99.99"));
    given(orderService.findById(1L)).willReturn(Mono.just(resp));

    webTestClient.get().uri("/api/v1/orders/1")
        .exchange()
        .expectStatus().isOk()
        .expectBody(OrderResponse.class)
        .isEqualTo(resp);
  }

  @Test
  void findById_whenNotFound_returns404() {
    given(orderService.findById(99L))
        .willReturn(Mono.error(new ResourceNotFoundException("Order not found: 99")));

    webTestClient.get().uri("/api/v1/orders/99")
        .exchange()
        .expectStatus().isNotFound()
        .expectBody()
        .jsonPath("$.errorCode").isEqualTo("NOT_FOUND");
  }
}

// service/OrderServiceImplTest.java — StepVerifier for service unit tests
@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

  @Mock  private OrderRepository orderRepository;
  @Mock  private OrderMapper     orderMapper;
  @InjectMocks private OrderServiceImpl orderService;

  @Test
  void findById_whenExists_returnsResponse() {
    Order order = new Order(1L, "PENDING");
    OrderResponse expected = new OrderResponse(1L, "PENDING", new BigDecimal("99.99"));
    given(orderRepository.findById(1L)).willReturn(Mono.just(order));
    given(orderMapper.toResponse(order)).willReturn(expected);

    StepVerifier.create(orderService.findById(1L))
        .expectNext(expected)
        .verifyComplete();
  }

  @Test
  void findById_whenNotFound_throwsResourceNotFoundException() {
    given(orderRepository.findById(99L)).willReturn(Mono.empty());

    StepVerifier.create(orderService.findById(99L))
        .expectErrorMatches(ex ->
            ex instanceof ResourceNotFoundException &&
            ex.getMessage().contains("99"))
        .verify();
  }
}
```

---

## pom.xml dependencies

```xml
<!-- Spring WebFlux replaces spring-boot-starter-web -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>

<!-- R2DBC reactive driver + PostgreSQL -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-r2dbc</artifactId>
</dependency>
<dependency>
  <groupId>org.postgresql</groupId>
  <artifactId>r2dbc-postgresql</artifactId>
  <scope>runtime</scope>
</dependency>

<!-- Flyway needs blocking JDBC datasource for migrations -->
<dependency>
  <groupId>org.flywaydb</groupId>
  <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
  <groupId>org.postgresql</groupId>
  <artifactId>postgresql</artifactId>
  <scope>runtime</scope>
</dependency>

<!-- Reactive Spring Security -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- Reactive test client -->
<dependency>
  <groupId>io.projectreactor</groupId>
  <artifactId>reactor-test</artifactId>
  <scope>test</scope>
</dependency>

<!-- springdoc WebFlux -->
<dependency>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-starter-webflux-ui</artifactId>
  <version>2.5.0</version>
</dependency>
```

---

## application.yml (WebFlux-specific)

```yaml
spring:
  r2dbc:
    url: r2dbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:mydb}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    pool:
      max-size: 10
      initial-size: 2

  # Flyway uses separate blocking JDBC datasource
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:mydb}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}

  flyway:
    enabled: true
    locations: classpath:db/migration
    validate-on-migrate: true

  jpa:
    enabled: false    # disable JPA — using R2DBC only

# Actuator liveness + readiness probes
management:
  endpoint:
    health:
      probes:
        enabled: true
      group:
        readiness:
          include: readinessState, r2dbc
```

---

## Error handling pattern (same hierarchy as MVC)

```
AppException (base — carries HttpStatus + errorCode)
├── ResourceNotFoundException   → 404 NOT_FOUND
├── ValidationException         → 422 VALIDATION_ERROR
├── ConflictException           → 409 CONFLICT
├── ForbiddenException          → 403 FORBIDDEN
├── UnauthorizedException       → 401 UNAUTHENTICATED
├── RateLimitedException        → 429 RATE_LIMITED
└── ExternalServiceException    → 502 EXTERNAL_SERVICE_ERROR
```

- Same `AppException` hierarchy as MVC — reuse from `skills/common/error-handling.md`
- Use `WebExceptionHandler` instead of `@RestControllerAdvice`
- Services use `Mono.error(new ResourceNotFoundException(...))` instead of `throw`
- Never return empty `Mono` / `Flux` silently — always signal absence with an error

---

## Reference files — load only when relevant

| File | Load when |
|------|-----------|
| `skills/common/code-style.md` | Any Java code generation |
| `skills/common/code-style-index.md` | Quick rule lookup |
| `skills/common/error-handling.md` | AppException hierarchy, ApiErrorResponse, WebExceptionHandler |
| `skills/common/security.md` | JWT, reactive Spring Security, `@PreAuthorize`, RBAC |
| `skills/common/api-auth.md` | JWT lifecycle, OAuth2 reactive flows, service-to-service auth |
| `skills/common/testing.md` | StepVerifier, WebTestClient, Testcontainers R2DBC |
| `skills/common/data-migrations.md` | Flyway with blocking JDBC + R2DBC dual datasource |
| `skills/common/logging.md` | SLF4J, Reactor context MDC bridge, LogstashEncoder |
| `skills/common/observability.md` | Micrometer reactive, Actuator, OpenTelemetry reactor context propagation |
| `skills/common/microservices.md` | WebClient typed clients, Resilience4j reactor, reactive Kafka |
| `skills/common/deployment.md` | Docker, layered JAR, health probes, graceful shutdown |
| `skills/common/ci-cd.md` | GitHub Actions, JaCoCo, OWASP Dependency Check |
| `skills/common/dependency-management.md` | pom.xml, R2DBC BOM, WebFlux dependencies |

---

## Behaviour notes

- Always confirm WebFlux is intentional — default is Spring MVC (`skills/spring-boot/SKILL.md`)
- Always confirm the base package name (`com.nmn.{projectname}`) before generating
- State the dual-datasource assumption (JDBC for Flyway + R2DBC for app) before generating
- Never use JPA `@Entity` in a WebFlux project — use R2DBC `@Table` annotations instead
- Add `@Operation` and `@ApiResponse` OpenAPI annotations to all controller methods
- Use `Flux<T>` with `produces = TEXT_EVENT_STREAM_VALUE` for streaming endpoints
- For any new endpoint touching user data, remind user to check `skills/common/security.md` Section 11 checklist
