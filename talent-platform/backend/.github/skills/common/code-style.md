# Java Code Style & Conventions
# Enterprise Standard — Google Java Style + Effective Java (Bloch) + NMN, Version-Aware

> Authority: Google Java Style Guide, Effective Java (3rd ed.), Oracle Code Conventions.
> Applies to: Java 17+. Version deltas called out explicitly.
> This skill supersedes any prior code-style guidance. Load first, always.

---

## PRIME DIRECTIVE

"Prefer clarity over cleverness." — Joshua Bloch.

Rules have priorities:
1. Correctness — code that compiles but behaves wrong is unacceptable.
2. Consistency within a package — most important scope.
3. Consistency within a module/project — second.
4. This style guide — third.

Know when to deviate. Document why with a `// NOTE:` comment or
`@SuppressWarnings("...") // reason`.
Never break a public API just to comply with a style rule.

---

## 1. TOOLCHAIN

| Tool | Role | Version |
|------|------|---------|
| `google-java-format` | Canonical formatter | 1.22+ |
| `Checkstyle` | Style rule enforcement | 10.x |
| `SpotBugs` + `find-sec-bugs` | Static analysis + security | 4.x / 1.13+ |
| `PMD` | Code quality rules | 7.x |
| `JaCoCo` | Coverage measurement + gate | 0.8.12+ |
| `JUnit 5` + `AssertJ` | Test runner & assertions | 5.10+ / 3.25+ |
| `pre-commit` | Git hook runner | 3.6+ |

`google-java-format` is non-negotiable. CI must fail on any unformatted file.
Run it with: `java -jar google-java-format.jar --replace **/*.java`

---

## 2. CODE LAYOUT

### 2.1 Indentation

2 spaces for indentation (Google Java Style). Never tabs. `google-java-format` enforces this.

```java
// CORRECT — 2-space indent
public class OrderService {

  private final OrderRepository orderRepository;

  public OrderService(OrderRepository orderRepository) {
    this.orderRepository = orderRepository;
  }

  public OrderResponse findById(Long id) {
    return orderRepository.findById(id)
        .map(mapper::toResponse)                      // 4-space continuation indent
        .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
  }
}

// WRONG — 4-space indent (not Google style) or tabs
public class OrderService {
    private final OrderRepository orderRepository; // WRONG — 4 spaces
```

Continuation lines (when a statement wraps) use 4-space indent from the base line:

```java
// CORRECT — 4-space continuation
String result = someVeryLongMethodName(
    argumentOne,
    argumentTwo,
    argumentThree);

// CORRECT — chained method calls broken at the dot
return order.getItems().stream()
    .filter(Item::isActive)
    .map(mapper::toItemResponse)
    .toList();
```

### 2.2 Line Length

| Mode | Limit |
|------|-------|
| Hard cap | 100 characters |
| Team standard (internal) | 120 characters |

Document the choice in `checkstyle.xml`. Break long lines on call args or method chains,
never in the middle of a string literal.

```java
// CORRECT — one arg per line when over the limit
ResponseEntity<OrderResponse> response = restClient
    .post()
    .uri("/api/v1/orders")
    .contentType(MediaType.APPLICATION_JSON)
    .body(request)
    .retrieve()
    .toEntity(OrderResponse.class);

// WRONG — exceeds line limit, hard to read
ResponseEntity<OrderResponse> response = restClient.post().uri("/api/v1/orders").contentType(MediaType.APPLICATION_JSON).body(request).retrieve().toEntity(OrderResponse.class);
```

### 2.3 Blank Lines

| Context | Blank lines |
|---------|-------------|
| Between top-level class declarations | 1 |
| Between method declarations | 1 |
| Between import groups | 1 |
| Between logical sections inside a method | 1 (sparingly) |
| After class opening brace | 0 |
| Before class closing brace | 0 |

```java
package com.nmn.demo.service.impl;

import com.nmn.demo.exception.ResourceNotFoundException;
import com.nmn.demo.mapper.OrderMapper;
import com.nmn.demo.repository.OrderRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

  private final OrderRepository orderRepository;
  private final OrderMapper orderMapper;

  @Override
  public OrderResponse findById(Long id) {
    log.info("Finding order: id={}", id);
    return orderRepository.findById(id)
        .map(orderMapper::toResponse)
        .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
  }

  @Override
  public OrderResponse create(OrderRequest request) {
    Order order = orderMapper.toEntity(request);
    Order saved = orderRepository.save(order);
    log.info("Order created: id={}", saved.getId());
    return orderMapper.toResponse(saved);
  }
}
```

### 2.4 Source File Encoding

Always UTF-8. No BOM.

---

## 3. IMPORTS

### 3.1 Grouping and Ordering

Four groups, blank line between each, in this exact order:

```java
// Group 1: static imports
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

// Group 2: standard library (java.*, javax.*)
import java.time.Instant;
import java.util.List;
import java.util.Optional;

// Group 3: third-party
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;

// Group 4: local module (com.nmn.*)
import com.nmn.demo.dto.request.OrderRequest;
import com.nmn.demo.dto.response.OrderResponse;
import com.nmn.demo.exception.ResourceNotFoundException;
```

Configure `ImportOrder` module.
Configure IntelliJ: Settings → Editor → Code Style → Java → Imports to match.

### 3.2 Import Style Rules

```java
// CORRECT — one class per import
import java.util.List;
import java.util.Map;

// CORRECT — static import for constants and test assertion DSLs
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.HttpStatus.CREATED;

// WRONG — wildcard imports hide what is actually used
import java.util.*;
import org.springframework.web.bind.annotation.*;

// WRONG — unused imports (Checkstyle UnusedImports enforces this)
import java.io.File; // never referenced in this file
```

### 3.3 Forbidden / Restricted Imports

| Package / Class | Rule |
|-----------------|------|
| `java.util.logging` | Forbidden — use SLF4J (`@Slf4j`) |
| `System.out.println` / `System.err` | Forbidden in production code — use SLF4J |
| `java.util.Random` for security | Forbidden — use `SecureRandom` for tokens/IDs |
| `javax.*` (legacy) | Forbidden on Java 17+ — use `jakarta.*` |
| `sun.*` / `com.sun.*` | Forbidden — internal JDK APIs, not portable |
| `@Autowired` on fields | Forbidden — use constructor injection |
| `ObjectMapper` instantiated with `new` | Forbidden — inject the Spring-managed bean |

---

## 4. CLASS & FILE-LEVEL CONVENTIONS

### 4.1 Class Names

| Convention | Example | Notes |
|---|---|---|
| `PascalCase`, noun | `OrderService`, `ProductMapper` | Always a noun or noun phrase |
| No `Util`, `Helper`, `Manager` as standalone | Avoid `OrderUtil` | Split by domain responsibility instead |
| Suffix signals role | `OrderServiceImpl`, `OrderController`, `OrderMapper` | Consistent across codebase |
| Test classes | `OrderServiceImplTest`, `OrderControllerTest` | Same name + `Test` suffix |

```java
// WRONG — stuttering: order.OrderService already says "order"
package com.nmn.order;
public class OrderService { ... }
// Caller writes: orderService.createOrder(...)  ← "order" twice

// CORRECT — name the method, not the class
package com.nmn.order;
public class OrderService {
  public OrderResponse create(OrderRequest req) { ... }  // caller: orderService.create(...)
}
```

### 4.2 File Names

One public top-level class per file. Filename must match the class name exactly.

```
OrderService.java           ← interface
OrderServiceImpl.java       ← implementation
OrderController.java        ← REST layer
OrderMapper.java            ← DTO ↔ entity mapper
OrderServiceImplTest.java   ← unit test
OrderControllerTest.java    ← slice test
```

Never put multiple domain classes in one file (e.g., no `Models.java` with 10 entities).

### 4.3 Class Structure Order

Always declare members in this order (Checkstyle `MemberOrder` enforces it):

1. Static constants
2. Static fields
3. Instance fields (in constructor-injection order)
4. Constructors
5. Public methods (interface implementations first)
6. Package-private / protected methods
7. Private helper methods
8. Static utility methods
9. Inner classes / records

---

## 5. STRING LITERALS

```java
// CORRECT — double quotes (Java only has double-quoted strings)
String name = "Jane Doe";

// CORRECT — text blocks for multi-line strings (Java 15+)
String query = """
    SELECT id, email
    FROM users
    WHERE tenant_id = :tenantId
    """;

String json = """
    {
      "status": "PENDING",
      "amount": 99.99
    }
    """;

// CORRECT — String.format or formatted() for templating
String greeting = "Hello, %s!".formatted(name);  // Java 15+
String greeting = String.format("Hello, %s!", name);  // pre-15

// WRONG — string concatenation with + in a loop (O(n²))
String result = "";
for (String s : parts) {
  result += s;  // WRONG — creates a new String object every iteration
}

// CORRECT — StringBuilder for repeated concatenation
StringBuilder sb = new StringBuilder();
for (String s : parts) {
  sb.append(s);
}
String result = sb.toString();

// CORRECT — String.join when source is already a collection
String result = String.join(", ", parts);
```

---

## 6. WHITESPACE & FORMATTING

`google-java-format` decides 95% of these. The remaining 5%:

### 6.1 Pet Peeves (google-java-format does not catch all)

```java
// WRONG — spaces inside brackets
spam( ham[ 1 ], Map.of( "eggs", 2 ) );

// CORRECT
spam(ham[1], Map.of("eggs", 2));

// WRONG — no space before opening brace
public class Foo{
  public void bar(){

// CORRECT
public class Foo {
  public void bar() {

// WRONG — trailing whitespace on any line

// CORRECT — no trailing whitespace
```

### 6.2 Record and Class Literals

```java
// CORRECT — always use named parameters for @Value and @Query
@Value("${app.jwt.secret}")
private String jwtSecret;  // WRONG — use constructor injection instead; example only

// CORRECT — one annotation per line when stacking
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController { ... }

// WRONG — multiple annotations on one line (except parameter annotations)
@RestController @RequestMapping("/api/v1/orders")
public class OrderController { ... }
```

---

## 7. BRACES

Always use braces — even for single-line blocks. Google Java Style mandates this.

```java
// CORRECT — braces even for single statement
if (order == null) {
  throw new ResourceNotFoundException("Order not found");
}

// WRONG — omitting braces invites bugs
if (order == null)
  throw new ResourceNotFoundException("Order not found");
  log.warn("this runs always");  // BUG — indentation is misleading

// CORRECT — opening brace on the same line (K&R style)
public OrderResponse create(OrderRequest request) {
  ...
}

// WRONG — Allman style (opening brace on new line)
public OrderResponse create(OrderRequest request)
{  // WRONG in Java
  ...
}
```

---

## 8. COMMENTS & DOC COMMENTS

### 8.1 Core Rules

- Comments that contradict code are WORSE than no comments. Keep them updated.
- Write as complete sentences. Capitalise first word.
- Write in English (global audience).
- Explain WHY, not WHAT.

```java
// USEFUL — explains why
x = x + 1; // Compensate for 1-based index from legacy gateway (issue #443)

// USELESS — states the obvious
x = x + 1; // increment x
```

### 8.2 Javadoc — Mandatory on All Public API

Javadoc must describe behaviour, parameters, return value, and exceptions.
First sentence is the summary — used by IDEs and javadoc tool.

```java
// CORRECT
/**
 * Creates a new order and persists it to the database.
 *
 * @param request the order creation payload; must not be null
 * @return the created order as a response DTO
 * @throws ValidationException if any required field is missing
 * @throws ConflictException if an order with the same reference already exists
 */
OrderResponse create(OrderRequest request);

/**
 * Maximum number of login attempts before the account is locked.
 * Aligned with PCI DSS §8.1.6.
 */
int MAX_LOGIN_ATTEMPTS = 5;

// WRONG — no Javadoc on public service interface method
OrderResponse create(OrderRequest request);

// WRONG — Javadoc that just restates the method name
/**
 * Creates order.
 */
OrderResponse create(OrderRequest request);
```

### 8.3 Block Comments

```java
/**
 * Charges the customer's card via the payment gateway with exponential backoff.
 *
 * <p>The gateway returns HTTP 503 during peak hours (observed production pattern).
 * Each retry doubles the wait up to {@code MAX_PAYMENT_RETRIES}.
 */
public Receipt chargeCard(Order order, CreditCard card) {
  // Validate locally first — fewer round trips and zero gateway fees on
  // obviously bad inputs.
  validateCard(card);
  ...
}
```

### 8.4 TODO / FIXME Convention (Team Standard)

```java
// TODO(username): Description. Ticket link.
// FIXME(username): Something broken, needs immediate attention.
// HACK(username): Workaround for external issue. Link to ticket.
// NOTE(username): Important context for future maintainers.

// Examples:
// TODO(arpit): Remove after Postgres 17 upgrade. JIRA-1234
// HACK(nishant): Gateway returns 200 on auth failure; check body instead. GW-1234
```

### 8.5 Suppression — Specificity Required

```java
// WRONG — bare suppression, no reason
@SuppressWarnings("unchecked")

// CORRECT — targeted suppression with reason
@SuppressWarnings("unchecked") // safe: List<String> is guaranteed by the JWT library contract
List<String> scopes = (List<String>) claims.get("scopes");

// CORRECT — SpotBugs suppression with reason
@SuppressFBWarnings(
  value = "EI_EXPOSE_REP",
  justification = "Intentional — this DTO is immutable by convention"
)
```

---

## 9. NAMING CONVENTIONS

### 9.1 Complete Reference

| Construct | Style | Example | Notes |
|-----------|-------|---------|-------|
| Package | `lowercase`, dot-separated | `com.nmn.order` | No underscores, no `MixedCaps` |
| Class / Interface | `PascalCase` | `OrderService`, `UserMapper` | Noun or noun phrase |
| Method | `camelCase`, verb | `findById`, `createOrder` | Verb or verb phrase |
| Variable | `camelCase` | `orderRepository`, `userId` | No single letters except loop vars |
| Constant | `UPPER_SNAKE_CASE` | `MAX_RETRIES`, `DEFAULT_PAGE_SIZE` | `static final` fields |
| Enum value | `UPPER_SNAKE_CASE` | `ORDER_STATUS_PENDING` | |
| Type parameter | Single capital | `T`, `K`, `V` | Bounds: `<T extends Comparable<T>>` |
| Test method | `methodName_scenario_expectedBehaviour` | `create_whenDuplicateEmail_throwsConflict` | |
| Acronym | Treat as word | `userId`, `parseUrl`, `httpClient` | Not `userID`, not `parseURL` |

### 9.2 Names to Avoid

```java
// Never shadow java.lang names
String object = "foo";   // shadows Object
int string = 5;          // shadows String

// Never use 'l' (lowercase L) as a variable name — looks like 1
long l = 100L;  // WRONG
long count = 100L;  // CORRECT

// Never use 'this' or 'self' as a variable name
// (they have meaning in Java; shadowing causes confusion)

// Single-letter names — only OK in tight scopes (loop indices, lambda params)
for (int i = 0; i < list.size(); i++) { ... }  // OK
list.stream().map(o -> o.getName()).toList();   // OK for lambdas
```

### 9.3 Constants — Named, Never Magic Numbers

```java
// CORRECT
private static final int MAX_LOGIN_ATTEMPTS  = 5;       // Locks account after N failures (PCI DSS §8.1.6)
private static final int DEFAULT_PAGE_SIZE   = 20;      // Matches DB index scan page size
private static final long TOKEN_EXPIRY_MS    = 900_000; // 15 minutes — PCI DSS session requirement
// Note: use underscores in numeric literals for readability (Java 7+)

// WRONG
if (attempts > 5) {   // where does 5 come from?
  lockAccount();
}

// Domain state — Java enum (typed constants)
public enum OrderStatus {
  PENDING,
  CONFIRMED,
  SHIPPED,
  DELIVERED,
  CANCELLED;
}

// Attach behaviour to enum values
public enum OrderStatus {
  PENDING("pending"),
  CONFIRMED("confirmed"),
  SHIPPED("shipped");

  private final String value;

  OrderStatus(String value) { this.value = value; }

  public String getValue() { return value; }

  public boolean isTerminal() {
    return this == DELIVERED || this == CANCELLED;
  }
}
```

---

## 10. ZERO VALUES & INITIALISATION

### 10.1 Use Default Values Intentionally

```java
// CORRECT — Java initialises fields to safe defaults
public class Counter {
  private int count;       // 0 by default — intentional
  private boolean locked;  // false by default — intentional
}

// CORRECT — use Optional instead of null for absent values
public Optional<User> findByEmail(String email) {
  return userRepository.findByEmail(email);
}

// WRONG — returning null forces callers to null-check
public User findByEmail(String email) {
  return userRepository.findByEmail(email).orElse(null); // WRONG
}

// WRONG — initialising a list to null
private List<String> items = null; // use List.of() or new ArrayList<>()
```

### 10.2 Object Construction

```java
// CORRECT — constructor injection; immutable fields
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
  private final OrderRepository orderRepository; // injected, never null
  private final OrderMapper orderMapper;
}

// CORRECT — factory method for validated construction
public static User create(String email, String name) {
  if (email == null || email.isBlank()) {
    throw new ValidationException("email", "Email is required");
  }
  return new User(email, name);
}

// WRONG — public mutable constructor with no validation
public User() {}  // caller can create User with null email and save to DB
```

---

## 11. TYPE & INTERFACE DESIGN

### 11.1 Program to Interfaces

```java
// CORRECT — depend on the interface, not the implementation
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
  private final OrderRepository orderRepository; // JpaRepository interface
}

// WRONG — depend on the concrete type
private final OrderRepositoryImpl orderRepository; // breaks testability
```

### 11.2 Define Interfaces Where They Are Consumed

```java
// CORRECT — OrderService defines what it needs from the user domain
package com.nmn.order.service;

public interface UserFinder {
  Optional<User> findById(Long id);
}

// WRONG — UserRepository defines an interface for its own type
// (Spring Data already gives you this via JpaRepository)
package com.nmn.user.repository;
public interface UserRepositoryCustom { ... } // usually unnecessary
```

### 11.3 Keep Interfaces Small (Interface Segregation)

```java
// CORRECT — smallest possible interface
public interface OrderReader {
  Optional<OrderResponse> findById(Long id);
  Page<OrderResponse> findAll(Pageable pageable);
}

public interface OrderWriter {
  OrderResponse create(OrderRequest request);
  OrderResponse update(Long id, OrderRequest request);
  void delete(Long id);
}

// WRONG — fat interface; all consumers depend on everything
public interface OrderService {
  Optional<OrderResponse> findById(Long id);
  Page<OrderResponse> findAll(Pageable pageable);
  OrderResponse create(OrderRequest request);
  OrderResponse update(Long id, OrderRequest request);
  void delete(Long id);
  List<OrderResponse> findByCustomerId(Long customerId);
  BigDecimal calculateTotalRevenue(LocalDate from, LocalDate to);
  void exportToCsv(OutputStream out);
}
// Split by read/write/reporting/export if consumers differ
```

### 11.4 Records (Java 16+)

```java
// CORRECT — records for immutable DTOs and value objects
public record OrderResponse(
    Long id,
    String status,
    BigDecimal total,
    LocalDateTime createdAt
) {}

// CORRECT — compact constructor for validation
public record CreateOrderRequest(
    @NotBlank String customerId,
    @NotEmpty List<OrderItemRequest> items
) {
  public CreateOrderRequest {
    if (total(items).compareTo(BigDecimal.ZERO) <= 0)
      throw new ValidationException("total", "Order total must be positive");
  }
}

// CORRECT — records as map keys / cache keys (equals + hashCode generated)
public record CacheKey(Long tenantId, Long orderId) {}

// WRONG — using records for mutable state
// Records are always final and immutable — don't use for JPA entities
```

### 11.5 Sealed Classes (Java 17+)

```java
// CORRECT — sealed hierarchy for a closed set of subtypes
public sealed interface PaymentResult
    permits PaymentResult.Success, PaymentResult.Failure, PaymentResult.Pending {

  record Success(String transactionId, BigDecimal amount) implements PaymentResult {}
  record Failure(String errorCode, String message)        implements PaymentResult {}
  record Pending(String trackingId)                       implements PaymentResult {}
}

// Exhaustive switch expression — compiler enforces all cases
String message = switch (result) {
  case PaymentResult.Success s -> "Charged: " + s.transactionId();
  case PaymentResult.Failure f -> "Failed: " + f.message();
  case PaymentResult.Pending p -> "Pending: " + p.trackingId();
};
```

---

## 12. PROGRAMMING RECOMMENDATIONS

### 12.1 Comparisons

```java
// CORRECT — equals() for object equality
if ("PENDING".equals(order.getStatus())) { ... }
if (Objects.equals(a, b)) { ... }  // null-safe

// CORRECT — == for primitives, enums, and identity checks
if (status == OrderStatus.PENDING) { ... }  // enum comparison

// WRONG — == for String comparison (compares reference, not value)
if (order.getStatus() == "PENDING") { ... }  // WRONG

// CORRECT — Optional instead of null checks
orderRepository.findById(id)
    .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));

// WRONG — explicit null checks that Optional replaces
User user = userRepository.findById(id);
if (user == null) { throw new ResourceNotFoundException(...); }
```

### 12.2 Boolean Expressions

```java
// CORRECT
if (isActive) { ... }
if (!isDone) { ... }

// WRONG — explicit boolean comparison
if (isActive == true) { ... }
if (isDone == false) { ... }

// CORRECT — Boolean.TRUE.equals for nullable Boolean
if (Boolean.TRUE.equals(user.getActive())) { ... }
```

### 12.3 Early Return; Avoid Deep Nesting

```java
// CORRECT — guard clauses return early
public OrderResponse process(OrderRequest request) {
  if (request == null) {
    throw new ValidationException("request", "Request must not be null");
  }
  if (!request.hasItems()) {
    throw new ValidationException("items", "Order must have at least one item");
  }
  return doProcess(request);
}

// WRONG — pyramid of doom
public OrderResponse process(OrderRequest request) {
  if (request != null) {
    if (request.hasItems()) {
      return doProcess(request);
    } else {
      throw new ValidationException("items", "...");
    }
  } else {
    throw new ValidationException("request", "...");
  }
}
```

### 12.4 Exception Handling — Complete Reference

```java
// CORRECT — throw typed AppException subclasses (see error-handling.md)
public OrderResponse findById(Long id) {
  return orderRepository.findById(id)
      .map(mapper::toResponse)
      .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
}

// CORRECT — wrap external exceptions with context
try {
  return paymentGateway.charge(card, amount);
} catch (GatewayException ex) {
  throw new ExternalServiceException(
      "Payment gateway unavailable: " + ex.getMessage(), ex); // preserve cause
}

// WRONG — swallowing exceptions silently
try {
  return paymentGateway.charge(card, amount);
} catch (Exception ex) { } // CRITICAL — payment may have failed silently

// WRONG — catching Exception or Throwable and ignoring
} catch (Throwable t) {
  log.error("error"); // no context, no rethrow — broken monitoring
}

// WRONG — using exceptions for flow control
try {
  return Integer.parseInt(value);
} catch (NumberFormatException ex) {
  return 0; // use StringUtils.isNumeric() check instead; exceptions are expensive
}

// CORRECT — use try-with-resources for AutoCloseable
try (InputStream in = Files.newInputStream(path)) {
  return process(in);
} // in.close() called automatically — no finally needed
```

See `skills/common/error-handling.md` for the full hierarchy and HTTP mapping.

### 12.5 Streams & Collections

```java
// CORRECT — Stream for transformation pipelines
List<OrderResponse> responses = orders.stream()
    .filter(Order::isActive)
    .map(mapper::toResponse)
    .toList();  // Java 16+ unmodifiable list

// CORRECT — pre-size collections when length is known
List<Long> ids = new ArrayList<>(orders.size());
for (Order order : orders) {
  ids.add(order.getId());
}

// CORRECT — Map.of / List.of / Set.of for small literals
Map<String, String> headers = Map.of(
    "Content-Type", "application/json",
    "X-Request-ID", requestId
);

// WRONG — Stream.forEach for mutating external state (use a for loop)
orders.stream().forEach(o -> {
  o.setStatus(OrderStatus.SHIPPED);  // WRONG — side effects in streams
  orderRepository.save(o);
});

// CORRECT — for loop for mutation
for (Order order : orders) {
  order.setStatus(OrderStatus.SHIPPED);
  orderRepository.save(order);
}

// WRONG — keeping a sub-list that holds the full backing list alive
List<Order> huge = loadAllOrders();
List<Order> first10 = huge.subList(0, 10); // holds entire huge list in memory

// CORRECT — copy to break the reference
List<Order> first10 = new ArrayList<>(huge.subList(0, 10));
```

### 12.6 Optional Usage

```java
// CORRECT — Optional as a return type only (never as a field or parameter)
public Optional<User> findByEmail(String email) { ... }

// CORRECT — orElseThrow for mandatory presence
User user = findByEmail(email)
    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

// CORRECT — orElseGet for lazy default
User user = findByEmail(email)
    .orElseGet(() -> createGuest(email));

// CORRECT — map / flatMap for transformation
Optional<String> userName = findByEmail(email).map(User::getName);

// WRONG — Optional as a field type
public class Order {
  private Optional<String> notes; // WRONG — use @Nullable String or just String
}

// WRONG — Optional as a method parameter
public void process(Optional<User> user) { ... } // WRONG — use @Nullable or overload

// WRONG — isPresent() + get() (use map/orElse instead)
if (user.isPresent()) {
  return user.get().getName(); // WRONG — use user.map(User::getName).orElse(null)
}
```

### 12.7 Concurrency — Virtual Threads & @Async (Java 21+)

```java
// CORRECT — @Async for background tasks (Spring manages the thread pool)
@Async
public CompletableFuture<Void> sendWelcomeEmail(User user) {
  emailService.send(user.getEmail(), "Welcome!");
  return CompletableFuture.completedFuture(null);
}

// CORRECT — Virtual threads (Java 21+) for I/O-heavy workloads
// Enable globally in application.yml:
// spring.threads.virtual.enabled: true
// No code changes needed — Spring Boot 3.2+ uses virtual threads automatically.

// CORRECT — CompletableFuture for parallel independent calls
CompletableFuture<UserResponse>  userFuture  = CompletableFuture.supplyAsync(() -> userService.findById(userId));
CompletableFuture<List<OrderResponse>> ordersFuture = CompletableFuture.supplyAsync(() -> orderService.findByUser(userId));

CompletableFuture.allOf(userFuture, ordersFuture).join();
UserResponse    user   = userFuture.get();
List<OrderResponse> orders = ordersFuture.get();

// WRONG — creating Thread directly in application code
new Thread(() -> sendEmail(user)).start(); // WRONG — unmanaged, no error handling, no pool
```

### 12.8 Context Propagation (Spring)

```java
// CORRECT — MDC for structured logging correlation IDs
@Component
public class MdcFilter extends OncePerRequestFilter {
  @Override
  protected void doFilterInternal(HttpServletRequest req,
      HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String requestId = Optional.ofNullable(req.getHeader("X-Request-ID"))
        .orElse(UUID.randomUUID().toString());
    MDC.put("requestId", requestId);
    MDC.put("userId", extractUserId(req));
    try {
      res.setHeader("X-Request-ID", requestId);
      chain.doFilter(req, res);
    } finally {
      MDC.clear(); // always clear — thread pool reuse
    }
  }
}

// CORRECT — @AuthenticationPrincipal for current user (never static SecurityContextHolder)
@GetMapping("/profile")
public ResponseEntity<UserResponse> getProfile(
    @AuthenticationPrincipal UserDetails principal) {
  return ResponseEntity.ok(userService.findByEmail(principal.getUsername()));
}

// WRONG — accessing security context statically in service layer
SecurityContextHolder.getContext().getAuthentication(); // WRONG in service — untestable
```

### 12.9 Variadic & Overloading

```java
// CORRECT — varargs for flexible APIs
public ApiErrorResponse(String message, String path, FieldError... fieldErrors) { ... }

// CORRECT — overloads for different call sites (no messy null defaults)
public Page<OrderResponse> findAll(Pageable pageable) { ... }
public Page<OrderResponse> findByStatus(OrderStatus status, Pageable pageable) { ... }

// WRONG — null default parameters (Java has no default params — use overloads)
public Page<OrderResponse> findAll(OrderStatus status, Pageable pageable) {
  if (status == null) return findAll(pageable); // WRONG — leaks null handling to callers
}
```

### 12.10 Pure Methods & Minimising Side Effects

Pure methods are easier to test, refactor, and reason about.

```java
// IMPURE — depends on external state; untestable without mocking
public BigDecimal getDiscountPrice(Long productId) {
  Product product = productRepository.findById(productId) // I/O
      .orElseThrow(() -> new ResourceNotFoundException("..."));
  if (LocalDate.now().getDayOfWeek() == DayOfWeek.SATURDAY) {  // external state
    return product.getPrice().multiply(new BigDecimal("0.9"));
  }
  return product.getPrice();
}

// PURE — same input always gives same output; no external dependencies
public BigDecimal calculateDiscountPrice(BigDecimal price, boolean isWeekend) {
  return isWeekend
      ? price.multiply(new BigDecimal("0.9"))
      : price;
}

// Call site — inject the dependencies
Product product = productRepository.findById(productId).orElseThrow(...);
boolean isWeekend = LocalDate.now().getDayOfWeek() == DayOfWeek.SATURDAY;
BigDecimal final = calculateDiscountPrice(product.getPrice(), isWeekend);
```

Rules:
- Business logic methods should be pure — inject inputs, return outputs.
- Side effects (DB writes, HTTP calls, file I/O) belong in the service/repository layer.
- Never modify a collection passed as a parameter — return a new one.
- Avoid static mutable state — it creates race conditions and breaks tests.

---

## 13. ANTI-PATTERNS — PRODUCTION INCIDENT REFERENCE

Each pattern below has caused a real production incident.

### 13.1 Silent Exception Swallowing

```java
// WORST — payment may or may not have succeeded
try {
  paymentGateway.charge(card, amount);
} catch (Exception ex) { } // CRITICAL — silent failure

// MINIMUM ACCEPTABLE
} catch (GatewayException ex) {
  log.error("Payment failed: orderId={}, error={}", order.getId(), ex.getMessage(), ex);
  throw new ExternalServiceException("Payment gateway failed", ex);
}
```

### 13.2 N+1 Query Problem

```java
// WRONG — N+1: one query for orders + one per order for items
List<Order> orders = orderRepository.findAll();
orders.forEach(o -> o.getItems().size()); // triggers N lazy loads

// CORRECT — fetch join in one query
@Query("SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.status = :status")
List<Order> findByStatusWithItems(@Param("status") OrderStatus status);

// CORRECT — @EntityGraph for flexible fetch strategy
@EntityGraph(attributePaths = {"items", "customer"})
List<Order> findByCustomerId(Long customerId);
```

### 13.3 Exposing Entities at the API Boundary

```java
// WRONG — entity leaked to controller response
@GetMapping("/{id}")
public ResponseEntity<Order> findById(@PathVariable Long id) {
  return ResponseEntity.ok(orderRepository.findById(id).orElseThrow());
  // CRITICAL: exposes passwordHash, internal IDs, lazy-load proxies, JPA metadata
}

// CORRECT — always map to DTO
@GetMapping("/{id}")
public ResponseEntity<OrderResponse> findById(@PathVariable Long id) {
  return ResponseEntity.ok(orderService.findById(id)); // service returns DTO
}
```

### 13.4 @Transactional on Private Methods

```java
// WRONG — Spring AOP proxies only intercept public methods;
// @Transactional on private has no effect
@Transactional
private void saveAndNotify(Order order) { ... } // silently does nothing

// CORRECT — must be public
@Transactional
public void saveAndNotify(Order order) { ... }

// WRONG — self-invocation bypasses the proxy
@Service
public class OrderServiceImpl {
  public void create(OrderRequest req) {
    saveAndNotify(new Order(req)); // direct call — @Transactional ignored
  }

  @Transactional
  public void saveAndNotify(Order order) { ... }
}

// CORRECT — call through the proxy (inject self or extract to another bean)
```

### 13.5 String Concatenation in Logging

```java
// WRONG — String is built even if DEBUG level is disabled (CPU waste)
log.debug("Processing order: " + order.getId() + " for customer: " + order.getCustomerId());

// CORRECT — SLF4J deferred evaluation with {}
log.debug("Processing order: id={} customerId={}", order.getId(), order.getCustomerId());
```

### 13.6 Mutable Static Fields (Global State)

```java
// WRONG — hidden coupling, racy, untestable
public class RequestContext {
  public static User currentUser; // CRITICAL — shared mutable state across requests
}

// CORRECT — Spring Security context (thread-local, request-scoped)
@AuthenticationPrincipal UserDetails principal

// CORRECT — ThreadLocal for request-scoped data (always clear in finally)
private static final ThreadLocal<String> REQUEST_ID = new ThreadLocal<>();
try {
  REQUEST_ID.set(UUID.randomUUID().toString());
  ...
} finally {
  REQUEST_ID.remove(); // CRITICAL — thread pool reuse; always remove
}
```

### 13.7 new Date() / LocalDate.now() in Pure Logic

Hard to test. Inject a clock.

```java
// WRONG — embedded clock
public boolean isExpired(Token token) {
  return LocalDateTime.now().isAfter(token.getExpiresAt()); // untestable
}

// CORRECT — inject the clock
public boolean isExpired(Token token, Clock clock) {
  return LocalDateTime.now(clock).isAfter(token.getExpiresAt());
}

// In production: inject Clock.systemUTC() via Spring @Bean
// In tests: pass Clock.fixed(instant, ZoneOffset.UTC) for determinism
```

### 13.8 BigDecimal from double

```java
// WRONG — floating-point rounding errors
BigDecimal price = new BigDecimal(19.99);   // WRONG — 19.989999999999998...
BigDecimal price = BigDecimal.valueOf(19.99); // WRONG — same issue

// CORRECT — always construct from String
BigDecimal price = new BigDecimal("19.99"); // CORRECT — exact

// CORRECT — from user input already validated as String
BigDecimal price = new BigDecimal(request.price()); // assuming price() is a String field
```

---

## 14. VERSION COMPATIBILITY MATRIX

| Feature | Java 11 | Java 17 | Java 21 |
|---------|---------|---------|---------|
| `var` (local type inference) | ✅ | ✅ | ✅ |
| Text blocks (`"""`) | ❌ | ✅ | ✅ |
| Records | ❌ | ✅ | ✅ |
| Sealed classes | ❌ | ✅ | ✅ |
| Pattern matching `instanceof` | ❌ | ✅ (preview→stable) | ✅ |
| Switch expressions | ❌ | ✅ | ✅ |
| `Stream.toList()` | ❌ | ✅ | ✅ |
| `String.formatted()` | ❌ | ✅ | ✅ |
| `Map.copyOf` / `List.copyOf` | ✅ | ✅ | ✅ |
| Pattern matching in `switch` | ❌ | preview | ✅ |
| Virtual threads (`Thread.ofVirtual`) | ❌ | ❌ | ✅ |
| Sequenced collections | ❌ | ❌ | ✅ |
| String templates (preview) | ❌ | ❌ | preview |

**Minimum for new projects: Java 17.**
Spring Boot 3.x requires Java 17. Target Java 21 for virtual thread support.

---

## 15. TOOLCHAIN CONFIGURATION

### 15.1 checkstyle.xml (key rules)

```xml
<?xml version="1.0"?>
<!DOCTYPE module PUBLIC
  "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN"
  "https://checkstyle.org/dtds/configuration_1_3.dtd">
<module name="Checker">
  <property name="severity" value="error"/>

  <module name="TreeWalker">
    <!-- Imports -->
    <module name="UnusedImports"/>
    <module name="IllegalImport">
      <property name="illegalPkgs" value="sun, com.sun, javax"/>
    </module>
    <module name="ImportOrder">
      <property name="groups" value="java,javax,org,com"/>
      <property name="separated" value="true"/>
    </module>

    <!-- Naming -->
    <module name="TypeName"/>
    <module name="MethodName"/>
    <module name="ParameterName"/>
    <module name="LocalVariableName"/>
    <module name="ConstantName"/>

    <!-- Braces -->
    <module name="NeedBraces"/>
    <module name="LeftCurly"/>

    <!-- Code quality -->
    <module name="MagicNumber">
      <property name="ignoreNumbers" value="-1, 0, 1, 2"/>
    </module>
    <module name="EmptyCatchBlock"/>
    <module name="EqualsHashCode"/>
    <module name="FinalLocalVariable"/>
    <module name="LineLength">
      <property name="max" value="120"/>
    </module>
  </module>
</module>
```

### 15.2 pre-commit Configuration

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-merge-conflict
      - id: check-added-large-files
        args: ["--maxkb=500"]

  - repo: local
    hooks:
      - id: google-java-format
        name: google-java-format
        language: system
        entry: java -jar tools/google-java-format.jar --replace
        types: [java]

      - id: checkstyle
        name: checkstyle
        language: system
        entry: mvn checkstyle:check --no-transfer-progress -q
        pass_filenames: false

      - id: maven-test
        name: unit tests
        language: system
        entry: mvn test --no-transfer-progress -q
        pass_filenames: false
```

### 15.3 pom.xml Discipline

```xml
<properties>
  <java.version>17</java.version>
  <!-- Pin every dependency explicitly — no open ranges -->
  <spring-boot.version>3.4.4</spring-boot.version>
  <jjwt.version>0.12.5</jjwt.version>
  <mapstruct.version>1.5.5.Final</mapstruct.version>
  <testcontainers.version>1.20.1</testcontainers.version>
</properties>
```

- Pin the `<java.version>` to a specific LTS version — never `17+` or `latest`.
- Run `mvn versions:display-dependency-updates` before every sprint.
- `pom.xml` always committed with locked versions.
- Vendoring not needed for Maven — use a Nexus/Artifactory proxy in air-gapped envs.

---

## APPENDIX: VIOLATIONS QUICK REFERENCE

CRITICAL — block merge immediately:
- Swallowed exception with empty `catch` block
- `@Autowired` field injection (use constructor injection)
- Entity returned directly from a controller (must be DTO)
- `new BigDecimal(double)` for monetary values (use `new BigDecimal("...")`)
- `@Transactional` on a private method (silently has no effect)
- `System.out.println` in production code
- `java.util.Random` for security tokens (use `SecureRandom`)
- Wildcard import (`import java.util.*`)
- N+1 query without `JOIN FETCH` or `@EntityGraph`
- ThreadLocal used without `remove()` in `finally`

ERROR — must fix before merge:
- Public service interface method without Javadoc
- Missing `@Valid` on a `@RequestBody` parameter
- Missing `ResponseEntity<T>` return type on controller method
- `Optional` used as a field type or method parameter
- `equals()` not overridden alongside `hashCode()` (or vice versa)
- Magic number without a named constant
- Mutable `static` field outside of constants
- `LocalDate.now()` / `new Date()` in a pure business logic method

WARNING — should fix, document exception if not:
- TODO without linked ticket or older than 30 days
- Trailing whitespace
- Imports not in correct group order
- Test method names that don't state behaviour (`testCreate` vs `create_whenDuplicateEmail_throwsConflict`)
- Method longer than 30 lines — consider extracting helpers
