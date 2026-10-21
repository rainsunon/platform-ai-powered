---
name: grpc
description: |
  Generates production-ready gRPC service code for Spring Boot projects following
  NMN standards. Use this skill whenever the user asks to: create a gRPC service
  or server, define a .proto file, generate gRPC stubs, implement a gRPC method,
  write a gRPC client, add gRPC interceptors, set up gRPC authentication or JWT
  validation, add gRPC error handling with Status codes, configure TLS for gRPC,
  add gRPC health checks, write gRPC unit or integration tests, set up bidirectional
  streaming, server streaming, client streaming, set up gRPC with Spring Boot,
  configure grpc-spring-boot-starter, add gRPC observability or tracing, or any task
  involving Protocol Buffers, protobuf, buf, gRPC, or service-to-service communication
  via gRPC. Even if the user says "add a proto file", "implement the service stub",
  "expose this as gRPC", or "call this service over gRPC" — trigger this skill.
---

# gRPC Skill — NMN Standards

## When to choose gRPC over REST

| Choose gRPC | Choose REST |
|-------------|-------------|
| Service-to-service (internal) communication | Public-facing consumer APIs |
| Strict contract enforcement between teams | Browser clients or mobile apps |
| High-throughput, low-latency internal calls | Simple CRUD with infrequent calls |
| Bidirectional or server streaming needed | Human-readable payloads required |
| Polyglot microservices (Java + Go + Python) | Team unfamiliar with protobuf |

**Default is REST** — only use this skill when gRPC is explicitly requested or the service is purely internal microservice-to-microservice.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 17+ |
| Build | Maven 3.9+ |
| Framework | Spring Boot 3.x + `grpc-spring-boot-starter` (net.devh) |
| Protocol | gRPC + Protocol Buffers (proto3) |
| Code generation | `protobuf-maven-plugin` |
| Contract linting | `buf` CLI |
| Security | TLS + JWT interceptor |
| Testing | JUnit 5 + `grpc-testing` + `GrpcServerExtension` |
| Observability | Micrometer + OpenTelemetry gRPC instrumentation |
| Code Style | `google-java-format` — 2-space indent, never tabs |
| Logging | SLF4J + `@Slf4j` |

---

## Package structure

```
com.nmn.{projectname}/
├── grpc/
│   ├── server/                    ← @GrpcService implementations
│   │   └── {Feature}GrpcService.java
│   ├── client/                    ← @GrpcClient stub wrappers
│   │   └── {Feature}GrpcClient.java
│   └── interceptor/               ← ServerInterceptor / ClientInterceptor
│       ├── JwtServerInterceptor.java
│       └── LoggingServerInterceptor.java
├── service/                       ← Business logic (reuse from REST if co-located)
│   ├── {Feature}Service.java
│   └── impl/{Feature}ServiceImpl.java
├── exception/                     ← AppException hierarchy (same as REST)
└── config/                        ← GrpcConfig, TLS config
src/main/proto/
└── com/nmn/{projectname}/
    └── {feature}.proto             ← .proto files live here
```

---

## Hard rules — enforce on every generation

1. **Proto first** — always write the `.proto` contract before any Java code
2. **Constructor injection only** — never `@Autowired` on fields
3. **Never expose domain entities in proto messages** — map to proto message types via a dedicated mapper
4. **Map domain exceptions to gRPC `Status` codes** — never let `RuntimeException` propagate as `UNKNOWN`
5. **Always set deadlines on client calls** — never call without a timeout
6. **TLS in production** — never plaintext gRPC in non-local environments
7. **`buf lint` in CI** — enforce backward compatibility on every PR
8. **Never generate proto stubs into source control** — generate in `target/` only
9. **Separate gRPC service impl from business logic** — `@GrpcService` delegates to `@Service`, never holds business logic itself
10. **JWT interceptor at the server level** — not inside each service method
11. **`@Slf4j` + SLF4J `{}` placeholders** — never `System.out.println`
12. **Propagate `X-Request-ID` via gRPC metadata** — for distributed tracing correlation

---

## Generation order — follow every time

1. `src/main/proto/.../feature.proto` — proto3 contract definition
2. Run `mvn generate-sources` to generate Java stubs into `target/`
3. `grpc/server/{Feature}GrpcService.java` — `@GrpcService` implementation
4. `grpc/client/{Feature}GrpcClient.java` — typed client wrapper (if this service calls another)
5. `service/{Feature}Service.java` + `impl/{Feature}ServiceImpl.java` — business logic
6. `grpc/interceptor/` — JWT interceptor + logging interceptor if not already present
7. `exception/GrpcExceptionMapper.java` — domain exception → gRPC Status mapping
8. Ask user before generating tests — they may want them as a separate step

---

## Proto file conventions

```protobuf
// src/main/proto/com/nmn/orders/order_service.proto
syntax = "proto3";

package com.nmn.orders;

// Java options — always set all three
option java_package         = "com.nmn.orders.grpc";
option java_outer_classname = "OrderServiceProto";
option java_multiple_files  = true;   // one class per message — always true

// Import well-known types for timestamps, wrappers, empty
import "google/protobuf/timestamp.proto";
import "google/protobuf/empty.proto";
import "google/protobuf/wrappers.proto";

// Service definition
service OrderService {
  // Unary RPC — standard request/response
  rpc GetOrder(GetOrderRequest) returns (OrderResponse);
  rpc CreateOrder(CreateOrderRequest) returns (OrderResponse);
  rpc DeleteOrder(DeleteOrderRequest) returns (google.protobuf.Empty);

  // Server streaming — stream results to client
  rpc ListOrders(ListOrdersRequest) returns (stream OrderResponse);

  // Bidirectional streaming
  rpc ProcessOrders(stream CreateOrderRequest) returns (stream OrderResponse);
}

message GetOrderRequest {
  string order_id = 1;                          // snake_case in proto
}

message CreateOrderRequest {
  string customer_id  = 1;
  repeated OrderItem items = 2;
  string currency     = 3;
}

message OrderItem {
  string product_id = 1;
  int32  quantity   = 2;
  string unit_price = 3;                        // string for monetary values — never double
}

message OrderResponse {
  string                    order_id    = 1;
  string                    customer_id = 2;
  string                    status      = 3;
  string                    total       = 4;    // string for money
  google.protobuf.Timestamp created_at  = 5;
}

message ListOrdersRequest {
  string customer_id = 1;
  int32  page_size   = 2;
  string page_token  = 3;
}

message DeleteOrderRequest {
  string order_id = 1;
}
```

**Proto naming rules:**
- Message names: `PascalCase`
- Field names: `snake_case` (protobuf convention — generated Java getters become camelCase automatically)
- Service names: `PascalCase` ending in `Service`
- RPC names: `PascalCase` verbs — `GetOrder`, `CreateOrder`, `ListOrders`
- Monetary values: always `string` — never `double` or `float`
- Timestamps: use `google.protobuf.Timestamp` — never plain `string`

---

## pom.xml setup

```xml
<properties>
  <grpc.version>1.64.0</grpc.version>
  <protobuf.version>3.25.3</protobuf.version>
  <grpc-spring-boot.version>3.1.0</grpc-spring-boot.version>
</properties>

<dependencies>
  <!-- grpc-spring-boot-starter — server + client + health check -->
  <dependency>
    <groupId>net.devh</groupId>
    <artifactId>grpc-spring-boot-starter</artifactId>
    <version>${grpc-spring-boot.version}</version>
  </dependency>

  <!-- gRPC stubs + core -->
  <dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-stub</artifactId>
    <version>${grpc.version}</version>
  </dependency>
  <dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-protobuf</artifactId>
    <version>${grpc.version}</version>
  </dependency>

  <!-- Protobuf Java runtime -->
  <dependency>
    <groupId>com.google.protobuf</groupId>
    <artifactId>protobuf-java</artifactId>
    <version>${protobuf.version}</version>
  </dependency>

  <!-- Well-known types (Timestamp, Empty, etc.) -->
  <dependency>
    <groupId>com.google.protobuf</groupId>
    <artifactId>protobuf-java-util</artifactId>
    <version>${protobuf.version}</version>
  </dependency>

  <!-- gRPC testing -->
  <dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-testing</artifactId>
    <version>${grpc.version}</version>
    <scope>test</scope>
  </dependency>
</dependencies>

<build>
  <extensions>
    <!-- Required for protobuf-maven-plugin OS detection -->
    <extension>
      <groupId>kr.motd.maven</groupId>
      <artifactId>os-maven-plugin</artifactId>
      <version>1.7.1</version>
    </extension>
  </extensions>

  <plugins>
    <!-- Generate Java stubs from .proto files -->
    <plugin>
      <groupId>org.xolstice.maven.plugins</groupId>
      <artifactId>protobuf-maven-plugin</artifactId>
      <version>0.6.1</version>
      <configuration>
        <protocArtifact>
          com.google.protobuf:protoc:${protobuf.version}:exe:${os.detected.classifier}
        </protocArtifact>
        <pluginId>grpc-java</pluginId>
        <pluginArtifact>
          io.grpc:protoc-gen-grpc-java:${grpc.version}:exe:${os.detected.classifier}
        </pluginArtifact>
      </configuration>
      <executions>
        <execution>
          <goals>
            <goal>compile</goal>
            <goal>compile-custom</goal>
          </goals>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

---

## Server implementation

```java
// grpc/server/OrderGrpcService.java
@GrpcService                         // registers with grpc-spring-boot-starter automatically
@RequiredArgsConstructor
@Slf4j
public class OrderGrpcService extends OrderServiceGrpc.OrderServiceImplBase {

  private final OrderService    orderService;   // delegate to business logic
  private final OrderGrpcMapper grpcMapper;

  @Override
  public void getOrder(GetOrderRequest request,
      StreamObserver<OrderResponse> observer) {
    try {
      log.info("gRPC getOrder: orderId={}", request.getOrderId());

      OrderResponse response = orderService
          .findById(Long.parseLong(request.getOrderId()))
          .map(grpcMapper::toProto)
          .orElseThrow(() -> new ResourceNotFoundException(
              "Order not found: " + request.getOrderId()));

      observer.onNext(response);
      observer.onCompleted();

    } catch (ResourceNotFoundException ex) {
      observer.onError(Status.NOT_FOUND
          .withDescription(ex.getMessage())
          .asRuntimeException());

    } catch (ForbiddenException ex) {
      observer.onError(Status.PERMISSION_DENIED
          .withDescription(ex.getMessage())
          .asRuntimeException());

    } catch (Exception ex) {
      log.error("gRPC getOrder failed: orderId={}", request.getOrderId(), ex);
      observer.onError(Status.INTERNAL
          .withDescription("Internal server error")
          .asRuntimeException());     // NEVER expose ex.getMessage() — may leak internals
    }
  }

  @Override
  public void listOrders(ListOrdersRequest request,
      StreamObserver<OrderResponse> observer) {
    try {
      orderService.findByCustomerId(request.getCustomerId())
          .stream()
          .map(grpcMapper::toProto)
          .forEach(observer::onNext);
      observer.onCompleted();

    } catch (Exception ex) {
      log.error("gRPC listOrders failed", ex);
      observer.onError(Status.INTERNAL
          .withDescription("Internal server error")
          .asRuntimeException());
    }
  }
}
```

---

## Exception → gRPC Status mapping

```java
// exception/GrpcExceptionMapper.java
public final class GrpcExceptionMapper {
  private GrpcExceptionMapper() {}

  /**
   * Maps domain AppException subclasses to the correct gRPC Status code.
   * Always use this — never map ad-hoc inside service methods.
   */
  public static StatusRuntimeException toStatusException(AppException ex) {
    Status status = switch (ex.getErrorCode()) {
      case "NOT_FOUND"              -> Status.NOT_FOUND;
      case "VALIDATION_ERROR"       -> Status.INVALID_ARGUMENT;
      case "CONFLICT"               -> Status.ALREADY_EXISTS;
      case "FORBIDDEN"              -> Status.PERMISSION_DENIED;
      case "UNAUTHENTICATED"        -> Status.UNAUTHENTICATED;
      case "RATE_LIMITED"           -> Status.RESOURCE_EXHAUSTED;
      case "EXTERNAL_SERVICE_ERROR" -> Status.UNAVAILABLE;
      default                       -> Status.INTERNAL;
    };
    return status.withDescription(ex.getMessage()).asRuntimeException();
  }
}

// Usage in @GrpcService:
} catch (AppException ex) {
  observer.onError(GrpcExceptionMapper.toStatusException(ex));
}
```

**gRPC Status → HTTP equivalent:**

| gRPC Status | HTTP | Use for |
|-------------|------|---------|
| `OK` | 200 | Success |
| `INVALID_ARGUMENT` | 400 | Bad request / validation failure |
| `NOT_FOUND` | 404 | Resource not found |
| `ALREADY_EXISTS` | 409 | Conflict / duplicate |
| `PERMISSION_DENIED` | 403 | Forbidden |
| `UNAUTHENTICATED` | 401 | Missing/invalid auth |
| `RESOURCE_EXHAUSTED` | 429 | Rate limited |
| `UNAVAILABLE` | 503 | Upstream service down |
| `INTERNAL` | 500 | Unexpected server error |
| `DEADLINE_EXCEEDED` | 504 | Timeout |

---

## JWT server interceptor

```java
// grpc/interceptor/JwtServerInterceptor.java
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtServerInterceptor implements ServerInterceptor {

  // Metadata key for Bearer token — must match client
  public static final Metadata.Key<String> AUTH_HEADER =
      Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER);

  public static final Context.Key<String> USER_ID_CTX =
      Context.key("userId");

  private final JwtService jwtService;
  private final UserDetailsService userDetailsService;

  // Whitelist — paths that don't require auth
  private static final Set<String> PUBLIC_METHODS = Set.of(
      "/grpc.health.v1.Health/Check"
  );

  @Override
  public <Q, R> ServerCall.Listener<Q> interceptCall(
      ServerCall<Q, R> call, Metadata headers, ServerCallHandler<Q, R> next) {

    String methodName = call.getMethodDescriptor().getFullMethodName();
    if (PUBLIC_METHODS.contains(methodName)) {
      return next.startCall(call, headers);
    }

    String authHeader = headers.get(AUTH_HEADER);
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      call.close(Status.UNAUTHENTICATED.withDescription("Missing Bearer token"), new Metadata());
      return new ServerCall.Listener<>() {};
    }

    String token = authHeader.substring(7);
    try {
      String username = jwtService.extractUsername(token);
      UserDetails user = userDetailsService.loadUserByUsername(username);

      if (!jwtService.isAccessTokenValid(token, user)) {
        call.close(Status.UNAUTHENTICATED.withDescription("Invalid or expired token"), new Metadata());
        return new ServerCall.Listener<>() {};
      }

      Context ctx = Context.current().withValue(USER_ID_CTX, username);
      return Contexts.interceptCall(ctx, call, headers, next);

    } catch (Exception ex) {
      log.warn("gRPC JWT validation failed: {}", ex.getMessage());
      call.close(Status.UNAUTHENTICATED.withDescription("Invalid token"), new Metadata());
      return new ServerCall.Listener<>() {};
    }
  }
}
```

---

## gRPC client

```java
// grpc/client/OrderGrpcClient.java
@Component
@Slf4j
public class OrderGrpcClient {

  // Blocking stub pins a thread for the full call duration.
  // For high-concurrency fan-out, use the async FutureStub and wrap in CompletableFuture.
  @GrpcClient("order-service")
  private OrderServiceGrpc.OrderServiceBlockingStub orderStub;

  /**
   * Fetches an order from the Order Service via gRPC.
   *
   * @throws ResourceNotFoundException if order does not exist
   * @throws ExternalServiceException  for all other gRPC errors
   */
  public com.nmn.orders.grpc.OrderResponse getOrder(String orderId) {
    try {
      return orderStub
          .withDeadlineAfter(5, TimeUnit.SECONDS)   // always set deadline
          .getOrder(GetOrderRequest.newBuilder()
              .setOrderId(orderId)
              .build());

    } catch (StatusRuntimeException ex) {
      log.error("gRPC getOrder failed: orderId={} status={}",
          orderId, ex.getStatus().getCode(), ex);

      throw switch (ex.getStatus().getCode()) {
        case NOT_FOUND       -> new ResourceNotFoundException("Order not found: " + orderId);
        case UNAUTHENTICATED -> new UnauthorizedException("Service auth failed");
        case PERMISSION_DENIED -> new ForbiddenException("Access denied");
        default              -> new ExternalServiceException(
            "Order Service gRPC failed: " + ex.getStatus(), ex);
      };
    }
  }
}
```

---

## application.yml

```yaml
# Server config
grpc:
  server:
    port: 9090
    security:
      enabled: true
      certificate-chain: ${GRPC_TLS_CERT_PATH}    # path to TLS cert
      private-key: ${GRPC_TLS_KEY_PATH}            # path to TLS key
    keep-alive-time: 30s
    keep-alive-timeout: 5s
    keep-alive-without-calls: false
    max-inbound-message-size: 4MB

  # Client config — one block per downstream service
  client:
    order-service:
      address: static://${ORDER_SERVICE_HOST:localhost}:${ORDER_SERVICE_GRPC_PORT:9090}
      negotiation-type: tls
      keep-alive-time: 30s
      keep-alive-timeout: 5s
      keep-alive-without-calls: true
      deadline: 5000    # ms — default deadline for all calls to this service

    # Local dev — plaintext (never in production)
    order-service-local:
      address: static://localhost:9090
      negotiation-type: plaintext    # NEVER in production
```

---

## Testing

```java
// grpc/server/OrderGrpcServiceTest.java — unit test with in-process server
@SpringBootTest
@ExtendWith(GrpcServerExtension.class)   // from grpc-testing
class OrderGrpcServiceTest {

  @RegisterExtension
  static final GrpcServerExtension grpcServer = new GrpcServerExtension();

  @Mock private OrderService   orderService;
  @Mock private OrderGrpcMapper grpcMapper;

  private OrderServiceGrpc.OrderServiceBlockingStub stub;

  @BeforeEach
  void setUp() {
    OrderGrpcService service = new OrderGrpcService(orderService, grpcMapper);
    grpcServer.getServiceRegistry().addService(service);
    stub = OrderServiceGrpc.newBlockingStub(grpcServer.getChannel());
  }

  @Test
  void getOrder_whenExists_returnsProtoResponse() {
    OrderDto dto = new OrderDto(1L, "PENDING", new BigDecimal("99.99"));
    OrderResponse proto = OrderResponse.newBuilder()
        .setOrderId("1").setStatus("PENDING").setTotal("99.99").build();

    given(orderService.findById(1L)).willReturn(Optional.of(dto));
    given(grpcMapper.toProto(dto)).willReturn(proto);

    OrderResponse response = stub.getOrder(
        GetOrderRequest.newBuilder().setOrderId("1").build());

    assertThat(response.getOrderId()).isEqualTo("1");
    assertThat(response.getStatus()).isEqualTo("PENDING");
  }

  @Test
  void getOrder_whenNotFound_throwsNotFoundStatus() {
    given(orderService.findById(99L)).willReturn(Optional.empty());

    StatusRuntimeException ex = assertThrows(StatusRuntimeException.class,
        () -> stub.getOrder(GetOrderRequest.newBuilder().setOrderId("99").build()));

    assertThat(ex.getStatus().getCode()).isEqualTo(Status.Code.NOT_FOUND);
  }
}
```

---

## buf.yaml — contract linting and breaking change detection

```yaml
# buf.yaml — place in project root alongside pom.xml
version: v2
modules:
  - path: src/main/proto
lint:
  use:
    - DEFAULT                 # Google API style guide rules
  except:
    - PACKAGE_VERSION_SUFFIX  # we use package names, not versioned paths
breaking:
  use:
    - FILE                    # detect breaking changes at the file level
```

CI step — add to `ci-cd.md` pipeline:
```yaml
- name: buf lint
  run: buf lint

- name: buf breaking change check
  run: buf breaking --against '.git#branch=main'
```

---

## Reference files — load only when relevant

| File | Load when |
|------|-----------|
| `skills/common/code-style.md` | Any Java code generation |
| `skills/common/error-handling.md` | AppException hierarchy, GrpcExceptionMapper |
| `skills/common/security.md` | JWT interceptor, TLS config, mTLS |
| `skills/common/api-auth.md` | Service-to-service auth, JWT lifecycle |
| `skills/common/testing.md` | GrpcServerExtension, StepVerifier for reactive gRPC |
| `skills/common/logging.md` | SLF4J in interceptors, MDC propagation via context |
| `skills/common/observability.md` | OpenTelemetry gRPC instrumentation, Micrometer |
| `skills/common/microservices.md` | Client patterns, Resilience4j, correlation ID propagation |
| `skills/common/deployment.md` | Docker TLS cert mounting, health probe config |
| `skills/common/ci-cd.md` | buf lint + breaking change check in pipeline |

---

## Behaviour notes

- Always write the `.proto` file first — never write Java service code before the contract is defined
- Confirm TLS requirement before generating config — always TLS in production, plaintext only in local dev
- Never expose internal error messages in `Status.withDescription()` for `INTERNAL` errors — use generic message
- Always set `.withDeadlineAfter(...)` on every blocking stub call — no exceptions
- Confirm the base package name (`com.nmn.{projectname}`) before generating
- Remind user to run `buf lint` before merging any `.proto` changes
- For co-located REST + gRPC services, the same `@Service` business logic layer is shared — only the `grpc/server/` and `controller/` layers are different
