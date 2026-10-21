# Microservices Patterns — Enterprise Standard

**Applies to:** Teams running 2+ independently deployed Spring Boot services.
**Prerequisite skills:** deployment.md, concurrency-patterns.md, observability.md, api-auth.md.

---

## SECTION 1 — SERVICE BOUNDARY RULES

### When to Split

| Split when | Don't split when |
|-----------|-----------------|
| Different deployment cadences needed | Team has < 4 developers |
| Different scaling needs (CPU vs I/O) | A shared database is acceptable |
| Different team ownership | Communication overhead exceeds benefit |
| Fault isolation required | Splitting by technical layer (API service, DB service) |

### Bounded Context Heuristic

A service owns one bounded context from Domain-Driven Design:

- **Order Service** — order lifecycle, cart, checkout
- **Payment Service** — charges, refunds, invoices
- **User Service** — registration, profile, auth
- **Notification Service** — email, SMS, push

**Anti-pattern:** a "shared" service every other depends on. That's a monolith with extra network hops.

---

## SECTION 2 — INTER-SERVICE COMMUNICATION

### Synchronous (HTTP / gRPC)

```java
// client/UserServiceClient.java
package com.nmn.order.client;

import com.nmn.order.client.dto.UserResponse;
import com.nmn.order.exception.ExternalServiceException;
import com.nmn.order.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

/**
 * Typed HTTP client for the User Service.
 * All timeouts, auth injection, and error mapping are handled here —
 * callers deal only with domain types and domain exceptions.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserServiceClient {

  private final RestClient userServiceRestClient; // configured in ClientConfig below

  /**
   * Fetches a user by ID.
   *
   * @throws ResourceNotFoundException if the User Service returns 404
   * @throws ExternalServiceException  if the User Service returns any other error
   */
  public UserResponse getUser(String userId) {
    try {
      return userServiceRestClient
          .get()
          .uri("/api/v1/users/{id}", userId)
          .retrieve()
          .body(UserResponse.class);

    } catch (HttpClientErrorException.NotFound ex) {
      throw new ResourceNotFoundException("User not found: " + userId);
    } catch (Exception ex) {
      log.error("User Service call failed: userId={}", userId, ex);
      throw new ExternalServiceException("User Service unavailable", ex);
    }
  }
}
```

```java
// config/ClientConfig.java
@Configuration
@RequiredArgsConstructor
public class ClientConfig {

  private final AppProperties props;

  /**
   * RestClient for User Service with:
   * - connect + read timeouts
   * - connection pool tuning
   * - Bearer token injection via request interceptor
   * - OpenTelemetry tracing via Micrometer observation
   */
  @Bean
  public RestClient userServiceRestClient(
      RestClient.Builder builder,
      ServiceTokenProvider tokenProvider,
      ObservationRegistry observationRegistry) {

    HttpClient httpClient = HttpClient.create()
        .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 2_000)
        .responseTimeout(Duration.ofSeconds(5))
        .option(ChannelOption.SO_KEEPALIVE, true);

    ClientHttpConnector connector =
        new ReactorClientHttpConnector(httpClient);

    return builder
        .baseUrl(props.services().userServiceBaseUrl())
        .clientConnector(connector)
        .requestInterceptor((req, body, execution) -> {
          req.getHeaders().setBearerAuth(tokenProvider.getToken());
          return execution.execute(req, body);
        })
        .observationRegistry(observationRegistry)  // OTel tracing
        .build();
  }
}
```

```yaml
# application.yml
app:
  services:
    user-service-base-url: ${USER_SERVICE_BASE_URL}
    order-service-base-url: ${ORDER_SERVICE_BASE_URL}
```

Rules:
- Always configure connect + read timeouts — never use the default `RestClient` without them.
- Always map upstream HTTP errors to domain exceptions at the client boundary.
- Always inject the Bearer token via a request interceptor — never hardcode.
- Always wrap `Exception` and rethrow as `ExternalServiceException` — callers deal only with domain types.

### When sync vs async

| Use synchronous (HTTP / gRPC) | Use asynchronous (events / Kafka) |
|-------------------------------|----------------------------------|
| Need immediate response | Fire-and-forget |
| Query / read operations | State change notifications |
| Simple request-reply | Fan-out to multiple consumers |
| Low latency required | Eventual consistency acceptable |

### Asynchronous (Events — Spring Kafka)

```java
// Order Service publishes an event
// event/OrderCompletedEvent.java
public record OrderCompletedEvent(
    String orderId,
    String userId,
    BigDecimal total,
    Instant occurredAt
) {}

// service/impl/OrderServiceImpl.java — publish after successful save
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

  private final OrderRepository    orderRepository;
  private final OrderEventPublisher eventPublisher;

  @Override
  @Transactional
  public OrderResponse create(OrderRequest request) {
    Order saved = orderRepository.save(orderMapper.toEntity(request));
    eventPublisher.publishOrderCompleted(saved);
    return orderMapper.toResponse(saved);
  }
}

// event/OrderEventPublisher.java
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventPublisher {

  private final KafkaTemplate<String, OrderCompletedEvent> kafkaTemplate;

  public void publishOrderCompleted(Order order) {
    OrderCompletedEvent event = new OrderCompletedEvent(
        order.getId().toString(),
        order.getUserId().toString(),
        order.getTotal(),
        Instant.now()
    );
    kafkaTemplate.send("order.completed", event.orderId(), event)
        .thenAccept(r -> log.info("Published order.completed: orderId={}", event.orderId()))
        .exceptionally(ex -> {
          log.error("Failed to publish order.completed: orderId={}", event.orderId(), ex);
          return null;
        });
  }
}

// Notification Service subscribes
// consumer/OrderEventConsumer.java
@Component
@Slf4j
@RequiredArgsConstructor
public class OrderEventConsumer {

  private final NotificationService notificationService;

  @KafkaListener(topics = "order.completed", groupId = "${app.kafka.group-id}")
  public void handleOrderCompleted(OrderCompletedEvent event) {
    log.info("Received order.completed: orderId={}", event.orderId());
    notificationService.sendOrderConfirmation(event.userId(), event.orderId());
  }
}
```

Use **Spring Kafka** (Kafka), **Spring AMQP** (RabbitMQ), or **Spring Messaging** (Redis Streams).
Never build your own broker.

---

## SECTION 3 — API CONTRACTS

### Contract-First Design

Define the contract before implementation using OpenAPI 3.1:

```yaml
# src/main/resources/openapi/user-service.yaml
openapi: 3.1.0
info:
  title: User Service
  version: 1.0.0
paths:
  /api/v1/users/{userId}:
    get:
      operationId: getUser
      parameters:
        - name: userId
          in: path
          required: true
          schema: { type: string }
      responses:
        "200":
          content:
            application/json:
              schema: { $ref: "#/components/schemas/UserResponse" }
        "404":
          content:
            application/json:
              schema: { $ref: "#/components/schemas/ApiErrorResponse" }
```

Generate server stubs and client code from the spec:

```xml
<!-- pom.xml — openapi-generator-maven-plugin -->
<plugin>
  <groupId>org.openapitools</groupId>
  <artifactId>openapi-generator-maven-plugin</artifactId>
  <version>7.6.0</version>
  <executions>
    <execution>
      <goals><goal>generate</goal></goals>
      <configuration>
        <inputSpec>src/main/resources/openapi/user-service.yaml</inputSpec>
        <generatorName>spring</generatorName>
        <configOptions>
          <useSpringBoot3>true</useSpringBoot3>
          <interfaceOnly>true</interfaceOnly>   <!-- generate interfaces, not controllers -->
          <useJakartaEe>true</useJakartaEe>
          <useTags>true</useTags>
        </configOptions>
        <output>target/generated-sources/openapi</output>
      </configuration>
    </execution>
  </executions>
</plugin>
```

For gRPC: write `.proto` first, generate code with `protoc` + `protobuf-maven-plugin`.
Lint contracts with `buf` for backward compatibility on every PR.

### Consumer-Driven Contracts (Spring Cloud Contract)

The consumer defines what it expects from the provider:

```groovy
// contracts/getUserById.groovy — lives in Provider's repo
Contract.make {
  description "should return user when user exists"
  request {
    method GET()
    url "/api/v1/users/user-123"
    headers { header("Authorization", matching("Bearer .+")) }
  }
  response {
    status OK()
    headers { contentType(applicationJson()) }
    body([
      id   : "user-123",
      email: anyEmail(),
      name : anyNonEmptyString()
    ])
  }
}
```

```java
// OrderServiceContractTest.java — consumer verifies only what it uses
@SpringBootTest
class UserServiceContractTest {

  @Test
  void getUserById_returnsRequiredFields() {
    UserResponse resp = userServiceClient.getUser("user-123");
    // Order Service only cares about id, email, name
    assertThat(resp.id()).isNotNull();
    assertThat(resp.email()).isNotBlank();
    assertThat(resp.name()).isNotBlank();
    // We don't assert on fields we don't consume
  }
}
```

### Versioning Between Services

- Internal APIs use header versioning: `Accept: application/vnd.nmn.v2+json`.
- Breaking changes require a new version + migration window.
- Consumer services declare which version they depend on in their `application.yml`.
- Provider maintains N and N-1 versions simultaneously.

```java
// controller/UserController.java — version routing via headers
@GetMapping(value = "/{id}", produces = "application/vnd.nmn.v2+json")
public ResponseEntity<UserResponseV2> getUserV2(@PathVariable String id) { ... }

@GetMapping(value = "/{id}", produces = "application/vnd.nmn.v1+json")
public ResponseEntity<UserResponseV1> getUserV1(@PathVariable String id) { ... }
```

---

## SECTION 4 — SHARED LIBRARIES

### What to Share

| Share | Don't share |
|-------|-------------|
| Auth filter / token verification | Business logic |
| Logging + MDC configuration | JPA entity classes |
| `ApiErrorResponse` DTO format | Service-specific schemas |
| Health check / Actuator config boilerplate | Domain entities |
| OpenTelemetry / Micrometer setup | Anything that creates coupling |
| Exception hierarchy (`AppException` subclasses) | Database migrations |

### Structure

```
com.nmn:nmn-common:{version}
├── nmn-common-auth/        ← JwtService, JwtAuthFilter
├── nmn-common-web/         ← GlobalExceptionHandler, ApiErrorResponse
├── nmn-common-logging/     ← MdcFilter, Logback config
├── nmn-common-observability/ ← OTel / Micrometer beans
└── pom.xml (BOM — dependencyManagement only)
```

```xml
<!-- Consuming service pom.xml — import the BOM -->
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>com.nmn</groupId>
      <artifactId>nmn-common</artifactId>
      <version>1.4.0</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>

<dependencies>
  <dependency>
    <groupId>com.nmn</groupId>
    <artifactId>nmn-common-auth</artifactId>
    <!-- version from BOM -->
  </dependency>
</dependencies>
```

**Rules:**
- Shared libraries are versioned and released to your internal Maven registry (Nexus / Artifactory).
- Pin to exact versions in consuming services — never use `LATEST` or `SNAPSHOT` in production.
- Never use `<relativePath>` hacks that create local path coupling.

---

## SECTION 5 — RESILIENCE PATTERNS

### Circuit Breaker (Resilience4j)

```java
// pom.xml
// <dependency>
//   <groupId>io.github.resilience4j</groupId>
//   <artifactId>resilience4j-spring-boot3</artifactId>
// </dependency>
// <dependency>
//   <groupId>org.springframework.boot</groupId>
//   <artifactId>spring-boot-starter-aop</artifactId>
// </dependency>

// application.yml
resilience4j:
  circuitbreaker:
    instances:
      user-service:
        slidingWindowSize: 10
        failureRateThreshold: 50          # open at 50% failure rate
        waitDurationInOpenState: 30s
        permittedNumberOfCallsInHalfOpenState: 1
        registerHealthIndicator: true

// client/UserServiceClient.java
@Component
@RequiredArgsConstructor
@Slf4j
public class UserServiceClient {

  private final RestClient userServiceRestClient;

  @CircuitBreaker(name = "user-service", fallbackMethod = "getUserFallback")
  public UserResponse getUser(String userId) {
    return userServiceRestClient
        .get()
        .uri("/api/v1/users/{id}", userId)
        .retrieve()
        .body(UserResponse.class);
  }

  /** Graceful degradation — return a placeholder when User Service is down. */
  private UserResponse getUserFallback(String userId, Exception ex) {
    log.warn("User Service circuit open, using fallback: userId={}", userId);
    return new UserResponse(userId, "User " + userId, null); // non-critical placeholder
  }
}
```

### Timeout + Retry + Fallback

```java
// application.yml
resilience4j:
  retry:
    instances:
      user-service:
        maxAttempts: 3
        waitDuration: 500ms
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2.0
        retryExceptions:
          - org.springframework.web.client.ResourceAccessException
          - com.nmn.order.exception.ExternalServiceException
        ignoreExceptions:
          - com.nmn.order.exception.ResourceNotFoundException  # 404 — don't retry

  timelimiter:
    instances:
      user-service:
        timeoutDuration: 5s

// client/UserServiceClient.java — stacked annotations (applied inner → outer: CB → Retry → TL)
@CircuitBreaker(name = "user-service", fallbackMethod = "getUserFallback")
@Retry(name = "user-service")
@TimeLimiter(name = "user-service")
public CompletableFuture<UserResponse> getUser(String userId) {
  return CompletableFuture.supplyAsync(() ->
      userServiceRestClient
          .get()
          .uri("/api/v1/users/{id}", userId)
          .retrieve()
          .body(UserResponse.class)
  );
}
```

### Rules

- Always configure connect + read timeouts on every external `RestClient` / `WebClient`.
- Always have a fallback (`fallbackMethod`) for non-critical dependencies.
- Only retry idempotent operations (`GET`, `PUT`) — never `POST` without idempotency keys.
- Use exponential backoff with jitter — never fixed-interval retries.
- Use the circuit breaker for high-failure-rate downstreams to prevent cascading failure.
- Never retry on `ResourceNotFoundException` (404) — it won't change with retries.

---

## SECTION 6 — DATA OWNERSHIP RULES

| Rule | Rationale |
|------|-----------|
| Each service owns its own database schema | No shared databases between services |
| Services expose data via APIs only, never direct DB access | Schema changes don't break consumers |
| Duplicate data is acceptable | Denormalise for autonomy; sync via events |
| Use eventual consistency where possible | Reduces coupling, improves availability |
| Saga pattern for distributed transactions | No distributed locks or 2PC |
| Each service runs its own Flyway migrations | Schema changes are independently deployable |

### Saga Pattern (Choreography)

```java
// Order Service — publishes event after local commit
@Transactional
public OrderResponse create(OrderRequest request) {
  Order order = orderRepository.save(new Order(request, OrderStatus.PENDING));
  eventPublisher.publishOrderCreated(order); // Notification → Payment → Inventory react
  return orderMapper.toResponse(order);
}

// Payment Service — listens and publishes result
@KafkaListener(topics = "order.created")
public void handleOrderCreated(OrderCreatedEvent event) {
  try {
    paymentService.charge(event.userId(), event.total());
    eventPublisher.publishPaymentSucceeded(event.orderId());
  } catch (PaymentException ex) {
    eventPublisher.publishPaymentFailed(event.orderId(), ex.getMessage());
  }
}

// Order Service — compensates on failure
@KafkaListener(topics = "payment.failed")
public void handlePaymentFailed(PaymentFailedEvent event) {
  orderRepository.findById(event.orderId()).ifPresent(order -> {
    order.setStatus(OrderStatus.CANCELLED);
    orderRepository.save(order);
  });
}
```

---

## SECTION 7 — gRPC SPECIFICS

```java
// pom.xml
// <dependency>
//   <groupId>net.devh</groupId>
//   <artifactId>grpc-spring-boot-starter</artifactId>
//   <version>3.1.0</version>
// </dependency>

// Server — annotate with @GrpcService (no port management needed)
@GrpcService
@RequiredArgsConstructor
@Slf4j
public class UserGrpcService extends UserServiceGrpc.UserServiceImplBase {

  private final UserService userService;

  @Override
  public void getUser(GetUserRequest req, StreamObserver<GetUserResponse> observer) {
    try {
      UserResponse user = userService.findById(Long.parseLong(req.getUserId()));
      observer.onNext(GetUserResponse.newBuilder()
          .setUserId(user.id().toString())
          .setEmail(user.email())
          .setName(user.name())
          .build());
      observer.onCompleted();
    } catch (ResourceNotFoundException ex) {
      observer.onError(Status.NOT_FOUND
          .withDescription(ex.getMessage())
          .asRuntimeException());
    } catch (Exception ex) {
      log.error("gRPC getUser failed: userId={}", req.getUserId(), ex);
      observer.onError(Status.INTERNAL
          .withDescription("Internal server error")
          .asRuntimeException());
    }
  }
}
```

```yaml
# application.yml — server config
grpc:
  server:
    port: 9090
    security:
      enabled: true
      certificate-chain: ${GRPC_TLS_CERT}
      private-key: ${GRPC_TLS_KEY}
  client:
    user-service:
      address: static://${USER_SERVICE_HOST:localhost}:9090
      negotiation-type: tls
      keep-alive-time: 30s
      keep-alive-timeout: 5s
      keep-alive-without-calls: true
```

```java
// Client — inject with @GrpcClient
@Component
@Slf4j
public class UserGrpcClient {

  @GrpcClient("user-service")
  private UserServiceGrpc.UserServiceBlockingStub userStub;

  public UserResponse getUser(String userId) {
    try {
      GetUserResponse resp = userStub.getUser(
          GetUserRequest.newBuilder().setUserId(userId).build());
      return new UserResponse(resp.getUserId(), resp.getEmail(), resp.getName());
    } catch (StatusRuntimeException ex) {
      if (ex.getStatus().getCode() == Status.Code.NOT_FOUND)
        throw new ResourceNotFoundException("User not found: " + userId);
      throw new ExternalServiceException("User Service gRPC failed", ex);
    }
  }
}
```

Use `buf` to lint, breaking-change-check, and generate from `.proto`.
Never commit generated `target/generated-sources/` to source control — generate in CI.

---

## SECTION 8 — CORRELATION ID PROPAGATION

Propagate `X-Request-ID`, `X-User-ID`, and `X-Tenant-ID` across every service boundary.

```java
// filter/CorrelationIdFilter.java — inbound: extract or generate
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {

  public static final String REQUEST_ID_HEADER = "X-Request-ID";
  public static final String USER_ID_HEADER    = "X-User-ID";
  public static final String TENANT_ID_HEADER  = "X-Tenant-ID";

  @Override
  protected void doFilterInternal(HttpServletRequest req,
      HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {

    String requestId = Optional.ofNullable(req.getHeader(REQUEST_ID_HEADER))
        .orElse(UUID.randomUUID().toString());

    MDC.put("requestId", requestId);
    MDC.put("userId",    req.getHeader(USER_ID_HEADER));
    MDC.put("tenantId",  req.getHeader(TENANT_ID_HEADER));

    res.setHeader(REQUEST_ID_HEADER, requestId);

    try {
      chain.doFilter(req, res);
    } finally {
      MDC.clear(); // always clear — thread pool reuse
    }
  }
}

// config/ClientConfig.java — outbound: forward MDC headers to downstream services
@Bean
public RestClient userServiceRestClient(RestClient.Builder builder, ...) {
  return builder
      .requestInterceptor((req, body, execution) -> {
        req.getHeaders().set(REQUEST_ID_HEADER, MDC.get("requestId"));
        req.getHeaders().set(USER_ID_HEADER,    MDC.get("userId"));
        req.getHeaders().set(TENANT_ID_HEADER,  MDC.get("tenantId"));
        req.getHeaders().setBearerAuth(tokenProvider.getToken());
        return execution.execute(req, body);
      })
      .build();
}
```
