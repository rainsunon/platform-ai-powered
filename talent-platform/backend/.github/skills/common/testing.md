# Testing — Enterprise Standard

**Applies to:** All Java Spring Boot projects.
**Philosophy:** Tests are not verification — they are specification. Write them first when possible.

---

## SECTION 0 — TESTING PRINCIPLES

These apply regardless of stack. They are the community consensus on what makes a Java test suite useful.

**One thing per test.** A test should focus on one bit of functionality. A test that exercises registration *and* login *and* profile update is three tests masquerading as one. Use `@Nested` classes when you need to group related cases — but each test method is still one assertion.

**Independence is imperative.** Every test runs in isolation and in any order. No test depends on side effects from another. Use `@BeforeEach` / `@AfterEach` and parameterised setups so each test builds its own state.

**Long, descriptive names.** `createOrder_withValidPayload_persistsOrder` beats `testCreateOrder`. State the expected behaviour. JUnit 5 supports `@DisplayName` for human-readable sentences.

**Speed matters.** Slow tests don't get run. Unit tests should finish in milliseconds. Tests over 100ms move to an integration test class annotated `@Tag("integration")`.

**Reproduce bugs as failing tests first.** The first step in fixing a bug is a test that fails on the bug and passes on the fix. That test is the most valuable permanent addition to the suite.

**Run before and after every session.** CI gates merges on the suite passing — non-negotiable.

**If a test is hard to explain, the code is wrong.** When a unit test's purpose isn't clear, the code under test usually has too many responsibilities. Refactor the code, not the test.

**Debug using a test.** Don't `System.out.println` to find a bug — write a test that isolates it. The test documents the fix.

---

## SECTION 1 — TOOLCHAIN

| Tool | Role |
|---|---|
| JUnit 5 (`junit-jupiter`) | Test runner; `mvn test` |
| AssertJ | Fluent, readable assertions |
| Mockito | Mocking and stubbing |
| Spring Boot Test (`@SpringBootTest`, slices) | Integration wiring |
| Testcontainers | Real PostgreSQL/Redis containers for integration tests |
| Awaitility | Async / eventual-consistency assertions |
| `MockMvc` / `WebTestClient` | HTTP layer testing without a running server |
| `@DataJpaTest` | Spring Data slice — real DB, no web layer |
| `@WebMvcTest` | Spring MVC slice — web layer, no DB |
| ArchUnit | Enforce layer and package dependency rules |

```xml
<!-- pom.xml — test dependencies -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-test</artifactId>  <!-- includes JUnit 5, Mockito, AssertJ -->
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>junit-jupiter</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>postgresql</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.awaitility</groupId>
  <artifactId>awaitility</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>com.tngtech.archunit</groupId>
  <artifactId>archunit-junit5</artifactId>
  <version>1.3.0</version>
  <scope>test</scope>
</dependency>
```

---

## SECTION 2 — TEST CATEGORIES AND SCOPE

### 2.1 Unit Tests

- Test a single class/method in complete isolation.
- All dependencies stubbed/mocked with Mockito.
- No network, no filesystem, no DB — zero I/O.
- < 1ms each; full unit suite < 5 seconds.
- Annotation: `@ExtendWith(MockitoExtension.class)` — no Spring context.
- Maven Surefire picks these up by default (`*Test.java`).

### 2.2 Integration Tests

- Test interaction between two or more components (e.g. service + real DB via Testcontainers).
- Use `@DataJpaTest` with a real Postgres Testcontainer — not H2 in-memory.
- May hit filesystem; never real external network.
- Tag with `@Tag("integration")` and separate Maven Failsafe execution (`*IT.java`).
- Run with `mvn verify -P integration-tests`.

### 2.3 Web Layer Tests

- Test Spring MVC controllers in isolation via `@WebMvcTest`.
- Uses `MockMvc` — no real HTTP server, no DB.
- All service dependencies mocked with `@MockBean`.

### 2.4 End-to-End Tests

- Test a complete user flow against a running service.
- Live in `src/test/java/.../e2e/` with `@Tag("e2e")`.
- Never run in unit/integration CI — separate workflow.

### 2.5 Benchmarks

- Use JMH (Java Microbenchmark Harness) for hot path benchmarks.
- Add `jmh-core` and `jmh-generator-annprocess` to a separate `benchmark` Maven module.
- Allocation and throughput tracked in CI for critical paths.

---

## SECTION 3 — TEST STRUCTURE AND NAMING

### 3.1 File and method naming

```
Source:   src/main/java/com/nmn/myservice/service/OrderService.java
Tests:    src/test/java/com/nmn/myservice/service/OrderServiceTest.java     ← unit
          src/test/java/com/nmn/myservice/service/OrderServiceIT.java       ← integration
          src/test/java/com/nmn/myservice/api/v1/OrderControllerTest.java   ← web slice

Method:   methodName_scenario_expectedBehaviour
          createOrder_withValidPayload_persistsOrder
          createOrder_withProductNotFound_throwsNotFoundException
          getOrders_withInactiveUser_throwsForbiddenException
```

```java
// JUnit 5 @DisplayName — human-readable test names in CI output
@DisplayName("OrderService")
class OrderServiceTest {

    @Nested
    @DisplayName("createOrder")
    class CreateOrder {

        @Test
        @DisplayName("persists order when payload is valid")
        void persistsOrder_whenPayloadIsValid() { ... }

        @Test
        @DisplayName("throws NotFoundException when product does not exist")
        void throwsNotFoundException_whenProductDoesNotExist() { ... }
    }
}
```

### 3.2 Parameterised Tests — the Java idiom

```java
// Parameterised test — one test method covers multiple input/output cases
@ParameterizedTest(name = "{0}")
@MethodSource("parseDurationCases")
void parseDuration(String name, String input, Duration expected, boolean expectException) {
    if (expectException) {
        assertThatThrownBy(() -> DurationParser.parse(input))
            .isInstanceOf(IllegalArgumentException.class);
        return;
    }
    assertThat(DurationParser.parse(input)).isEqualTo(expected);
}

static Stream<Arguments> parseDurationCases() {
    return Stream.of(
        Arguments.of("empty string returns zero",  "",      Duration.ZERO,      false),
        Arguments.of("plain seconds",              "30s",   Duration.ofSeconds(30), false),
        Arguments.of("hours",                      "2h",    Duration.ofHours(2),    false),
        Arguments.of("invalid unit",               "5xyz",  null,               true),
        Arguments.of("negative",                   "-1h",   Duration.ofHours(-1),   false)
    );
}
```

### 3.3 AAA Pattern — every test is three sections

```java
@Test
@DisplayName("persists order when data is valid")
void createOrder_withValidData_persistsOrder() {
    // Arrange
    Product product = new Product(1L, new BigDecimal("49.99"), true);
    given(productRepository.findById(1L)).willReturn(Optional.of(product));
    given(orderRepository.save(any(Order.class))).willAnswer(inv -> inv.getArgument(0));

    CreateOrderRequest request = new CreateOrderRequest(1L, 2, 42L);

    // Act
    Order result = orderService.create(request);

    // Assert
    assertThat(result.getProductId()).isEqualTo(1L);
    assertThat(result.getQuantity()).isEqualTo(2);
    then(orderRepository).should().save(any(Order.class));
}
```

---

## SECTION 4 — FIXTURES, HELPERS, CLEANUP

### 4.1 Test Builder / Object Mother pattern

A fluent builder for test fixtures — centralises object construction so every test starts from a clean, consistent state.

```java
// src/test/java/com/nmn/myservice/fixture/UserFixture.java
public class UserFixture {

    public static User aUser() {
        User user = new User();
        user.setEmail("test@example.com");
        user.setName("Test User");
        user.setRole(Role.VIEWER);
        user.setActive(true);
        return user;
    }

    public static User anAdminUser() {
        User user = aUser();
        user.setRole(Role.ADMIN);
        return user;
    }
}

// Usage in test
User user = UserFixture.aUser();
```

### 4.2 @BeforeEach / @AfterEach — per-test setup and teardown

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    @BeforeEach
    void setUp() {
        // per-test setup — runs before every @Test method
    }

    @AfterEach
    void tearDown() {
        // runs after every @Test method, even if the test throws
    }
}
```

### 4.3 @BeforeAll / @AfterAll — class-wide setup and teardown

```java
// Package-wide setup — e.g. start a shared Testcontainer once for the test class
@Testcontainers
@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
class UserRepositoryIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
}
```

---

## SECTION 5 — HTTP CONTROLLER TESTING

Use `@WebMvcTest` — loads only the web layer; all services are mocked with `@MockBean`.

```java
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    @DisplayName("returns 200 with user body when user exists")
    void getUser_whenUserExists_returns200() throws Exception {
        UserResponse response = new UserResponse(1L, "u@example.com", "Alice");
        given(userService.getById(1L)).willReturn(response);

        mockMvc.perform(get("/api/v1/users/1")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("u@example.com"))
            .andExpect(jsonPath("$.name").value("Alice"));
    }

    @Test
    @DisplayName("returns 404 when user does not exist")
    void getUser_whenUserNotFound_returns404() throws Exception {
        given(userService.getById(99L)).willThrow(new NotFoundException("User", 99L));

        mockMvc.perform(get("/api/v1/users/99"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("returns 422 when request body is invalid")
    void createUser_withInvalidBody_returns422() throws Exception {
        String body = """
            { "email": "not-an-email", "name": "" }
            """;

        mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isUnprocessableEntity());
    }
}
```

---

## SECTION 6 — DATABASE INTEGRATION TESTING

Use real Postgres via Testcontainers. H2 in-memory is **not** an acceptable substitute — production DB-specific behaviour (CTEs, JSONB, partial indexes, Postgres-specific functions) will not be exercised.

```java
// src/test/java/com/nmn/myservice/repository/UserRepositoryIT.java
@Tag("integration")
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class UserRepositoryIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",      postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.enabled",      () -> "true");
    }

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("persists user and assigns generated ID")
    void save_persistsUserAndAssignsId() {
        User user = UserFixture.aUser();

        User saved = userRepository.save(user);
        entityManager.flush();
        entityManager.clear();

        assertThat(saved.getId()).isNotNull();
        User found = userRepository.findById(saved.getId()).orElseThrow();
        assertThat(found.getEmail()).isEqualTo(user.getEmail());
    }

    @Test
    @DisplayName("findByEmail returns empty when email does not exist")
    void findByEmail_whenNotFound_returnsEmpty() {
        assertThat(userRepository.findByEmailAndTenant_Id("nope@example.com", 1L)).isEmpty();
    }
}
```

---

## SECTION 7 — MOCKING

### 7.1 Prefer Real over Mock

If a fake takes the same time and effort as a mock and is more representative, use the fake. A `MockMvc` test is preferable to mocking `RestTemplate`. A Testcontainer is preferable to `@MockBean` on the repository.

### 7.2 Mockito — standard mocking

```java
// BDDMockito style — given/when/then reads naturally with AAA
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock  OrderRepository orderRepository;
    @Mock  ProductRepository productRepository;
    @InjectMocks  OrderServiceImpl orderService;

    @Test
    void createOrder_withValidProduct_savesOrder() {
        // Arrange
        given(productRepository.findById(1L))
            .willReturn(Optional.of(ProductFixture.anActiveProduct()));
        given(orderRepository.save(any()))
            .willAnswer(inv -> inv.getArgument(0));

        // Act
        Order result = orderService.create(new CreateOrderRequest(1L, 2, 42L));

        // Assert
        assertThat(result).isNotNull();
        then(orderRepository).should(times(1)).save(any(Order.class));
        then(productRepository).shouldHaveNoMoreInteractions();
    }
}
```

### 7.3 Hand-Written Fakes — preferred over mocks for repositories

```java
// In-memory fake repository — implements the real interface with a HashMap backing store
public class FakeUserRepository implements UserRepository {

    private final Map<Long, User> store = new HashMap<>();
    private long idSeq = 1;

    @Override
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public User save(User user) {
        if (user.getId() == null) user.setId(idSeq++);
        store.put(user.getId(), user);
        return user;
    }

    // ... other interface methods throw UnsupportedOperationException unless needed
}
```

### 7.4 @MockBean vs @Mock

| Annotation | When to use |
|---|---|
| `@Mock` (Mockito) | Pure unit tests — no Spring context; fast |
| `@MockBean` (Spring Boot Test) | Integration/slice tests where a Spring bean must be replaced |

Prefer `@Mock` wherever possible — `@MockBean` restarts the Spring context between test classes.

---

## SECTION 8 — TIME, RANDOMNESS, AND CLOCK INJECTION

Production code must accept a clock dependency or take time as a parameter — makes time-dependent logic fully deterministic and testable without mocking static methods.

```java
// src/main/java/com/nmn/myservice/core/Clock.java
package com.nmn.myservice.core;

import java.time.Instant;

public interface Clock {
    Instant now();
}

// Production bean
@Component
public class SystemClock implements Clock {
    @Override
    public Instant now() { return Instant.now(); }
}

// Service uses injected clock
@Service
public class TokenServiceImpl implements TokenService {

    private final Clock clock;

    public TokenServiceImpl(Clock clock) { this.clock = clock; }

    public boolean isExpired(Instant expiresAt) {
        return clock.now().isAfter(expiresAt);
    }
}
```

```java
// Test injects a fixed clock
class TokenServiceTest {

    private final Instant FIXED_NOW = Instant.parse("2025-01-01T12:00:00Z");
    private final Clock fixedClock = () -> FIXED_NOW;

    @Test
    void isExpired_whenExpiryIsInPast_returnsTrue() {
        TokenService service = new TokenServiceImpl(fixedClock);
        assertThat(service.isExpired(FIXED_NOW.minusSeconds(1))).isTrue();
    }
}
```

For randomness, inject `SecureRandom` or accept a `java.util.function.Supplier<UUID>` — pass a fixed supplier in tests.

---

## SECTION 9 — ASYNC AND CONCURRENCY TESTING

### 9.1 Awaitility — async and eventual-consistency assertions

```java
import static org.awaitility.Awaitility.await;

@Test
@DisplayName("processes event within 5 seconds")
void eventIsProcessed_withinTimeout() {
    eventBus.publish(new OrderCreatedEvent(orderId));

    await().atMost(5, TimeUnit.SECONDS)
           .pollInterval(100, TimeUnit.MILLISECONDS)
           .untilAsserted(() ->
               assertThat(orderRepository.findById(orderId)).isPresent()
           );
}
```

Never use `Thread.sleep()` in tests — it is flaky and slow. Always use Awaitility.

### 9.2 Thread-safety testing

```java
@Test
@DisplayName("counter is thread-safe under concurrent increments")
void counter_isThreadSafe() throws InterruptedException {
    AtomicCounter counter = new AtomicCounter();
    int threads = 8, increments = 1000;
    ExecutorService executor = Executors.newFixedThreadPool(threads);
    CountDownLatch latch = new CountDownLatch(threads * increments);

    for (int i = 0; i < threads * increments; i++) {
        executor.submit(() -> {
            counter.increment();
            latch.countDown();
        });
    }

    latch.await(10, TimeUnit.SECONDS);
    executor.shutdown();
    assertThat(counter.getValue()).isEqualTo(threads * increments);
}
```

---

## SECTION 10 — COVERAGE

```bash
# Run with JaCoCo coverage report
mvn test jacoco:report

# View: target/site/jacoco/index.html

# CI gate — fail build if coverage drops below 80%
# Configure in pom.xml:
```

```xml
<!-- pom.xml — JaCoCo plugin with coverage gate -->
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <executions>
    <execution>
      <id>prepare-agent</id>
      <goals><goal>prepare-agent</goal></goals>
    </execution>
    <execution>
      <id>check</id>
      <goals><goal>check</goal></goals>
      <configuration>
        <rules>
          <rule>
            <element>BUNDLE</element>
            <limits>
              <limit>
                <counter>LINE</counter>
                <value>COVEREDRATIO</value>
                <minimum>0.80</minimum>
              </limit>
              <limit>
                <counter>BRANCH</counter>
                <value>COVEREDRATIO</value>
                <minimum>0.75</minimum>
              </limit>
            </limits>
          </rule>
        </rules>
        <excludes>
          <!-- Exclude wiring and generated code -->
          <exclude>**/Application.class</exclude>
          <exclude>**/config/**</exclude>
          <exclude>**/dto/**</exclude>
        </excludes>
      </configuration>
    </execution>
  </executions>
</plugin>
```

### Coverage Rules

- Minimum 80% line coverage on every package containing business logic (`service/`, `model/`).
- Minimum 75% branch coverage — exercise both arms of every `if`.
- Exclude `Application.java`, `config/`, generated classes, and pure DTOs.
- Coverage is a floor, not a ceiling. 90% with the wrong tests is worse than 60% with the right ones.

---

## SECTION 11 — PROPERTY-BASED TESTING

Mandatory for parsers and any code that handles untrusted input. Use jqwik — a property-based testing library for JVM that generates inputs automatically and verifies invariants hold across all of them.

```xml
<dependency>
  <groupId>net.jqwik</groupId>
  <artifactId>jqwik</artifactId>
  <version>1.8.4</version>
  <scope>test</scope>
</dependency>
```

```java
import net.jqwik.api.*;

// Property-based test — verifies round-trip parsing holds for all generated inputs
class DurationParserPropertyTest {

    @Property
    @Label("round-trip: parse(format(d)) == d for any valid duration string")
    void roundTrip(@ForAll("validDurations") String input) {
        Duration parsed = DurationParser.parse(input);
        Duration reparsed = DurationParser.parse(DurationParser.format(parsed));
        assertThat(reparsed).isEqualTo(parsed);
    }

    @Provide
    Arbitrary<String> validDurations() {
        return Arbitraries.of("0s", "1s", "30s", "1h", "2h30m", "24h");
    }

    @Property
    @Label("parser never throws NullPointerException on any string input")
    void neverThrowsNpe(@ForAll String anyInput) {
        // Should throw IllegalArgumentException for invalid input, never NPE
        try {
            DurationParser.parse(anyInput);
        } catch (IllegalArgumentException ignored) {
            // expected for invalid input
        }
        // If NPE is thrown, jqwik reports it as a test failure
    }
}
```

---

## SECTION 12 — TEST DOUBLES VOCABULARY

| Type | Behaviour | Java tool |
|---|---|---|
| Dummy | Passed but never used. Satisfies a parameter type. | `mock(X.class)` with no stubbing |
| Stub | Returns canned answers. Verifies no state. | `given(x.method()).willReturn(value)` |
| Fake | Working implementation, not production-grade. (in-memory store, etc.) | Hand-written `FakeUserRepository` |
| Mock | Pre-programmed expectations, asserts they were met. | `then(x).should().method(...)` |
| Spy | Wraps a real object; records calls; asserts after the fact. | `@Spy` / `Mockito.spy(realObject)` |

**Prefer fakes over mocks.** A `FakeUserRepository` with an in-memory `HashMap` is more representative than a Mockito mock with `given(repo.findById(...)).willReturn(...)` stubs — it exercises real branching logic and is less brittle to refactoring.

---

## SECTION 13 — REDIS INTEGRATION TESTING

For code that depends on Redis (rate limiting, token revocation, distributed caching), use a real Redis container via Testcontainers — never mock `RedisTemplate`.

```xml
<!-- pom.xml -->
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>testcontainers</artifactId>
  <scope>test</scope>
</dependency>
```

```java
// src/test/java/com/nmn/myservice/service/TokenRevocationServiceIT.java
@Tag("integration")
@SpringBootTest
@Testcontainers
class TokenRevocationServiceIT {

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }

    @Autowired
    private TokenRevocationService tokenRevocationService;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @BeforeEach
    void setUp() {
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushAll();
    }

    @Test
    @DisplayName("revoke stores JTI in Redis and isRevoked returns true")
    void revoke_storesJtiAndMarksAsRevoked() {
        String jti = UUID.randomUUID().toString();

        tokenRevocationService.revoke(jti, Duration.ofMinutes(15));

        assertThat(tokenRevocationService.isRevoked(jti)).isTrue();
    }

    @Test
    @DisplayName("isRevoked returns false for unknown JTI")
    void isRevoked_forUnknownJti_returnsFalse() {
        assertThat(tokenRevocationService.isRevoked("unknown-jti")).isFalse();
    }
}
```

**Rate-limiting tests** — use the same Redis container pattern and reset the bucket between tests with `redisTemplate.delete(key)`.

---

## SECTION 14 — SECURITY AND @PreAuthorize TESTING

Test method-level security at the service layer by loading a minimal Spring Security context.

```java
// src/test/java/com/nmn/myservice/service/OrderServiceSecurityIT.java
@SpringBootTest
class OrderServiceSecurityIT {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Test
    @DisplayName("deleteOrder throws AccessDeniedException when user lacks ADMIN role")
    @WithMockUser(roles = "VIEWER")
    void deleteOrder_withViewerRole_throwsAccessDeniedException() {
        assertThatThrownBy(() -> orderService.deleteOrder(1L))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("deleteOrder succeeds when user has ADMIN role")
    @WithMockUser(roles = "ADMIN")
    void deleteOrder_withAdminRole_deletesSuccessfully() {
        // Arrange — persist an order first
        Order saved = orderRepository.save(OrderFixture.aPendingOrder());

        // Act + Assert — no exception
        assertThatCode(() -> orderService.deleteOrder(saved.getId()))
            .doesNotThrowAnyException();
    }
}
```

For `@WebMvcTest` authentication tests:

```java
@WebMvcTest(OrderController.class)
class OrderControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderService orderService;

    @Test
    @DisplayName("returns 401 when no authentication is provided")
    void listOrders_withNoAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/orders"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("returns 403 when authenticated user lacks required role")
    @WithMockUser(roles = "VIEWER")
    void deleteOrder_withViewerRole_returns403() throws Exception {
        mockMvc.perform(delete("/api/v1/orders/1"))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("returns 200 when ADMIN accesses protected endpoint")
    @WithMockUser(roles = "ADMIN")
    void listOrders_withAdminRole_returns200() throws Exception {
        given(orderService.findAll(any())).willReturn(Page.empty());

        mockMvc.perform(get("/api/v1/orders"))
            .andExpect(status().isOk());
    }
}
```

---

## SECTION 15 — @SpringBootTest USAGE GUIDE

`@SpringBootTest` starts the full application context. Use it selectively — it is 5–20× slower than slice tests.

| Scenario | Annotation | Reason |
|---|---|---|
| Unit test (no Spring) | `@ExtendWith(MockitoExtension.class)` | Fastest — no context |
| Controller HTTP layer | `@WebMvcTest` | Web slice only |
| Repository queries | `@DataJpaTest` | JPA slice, real DB |
| Kafka consumer | `@SpringBootTest` + Testcontainers Kafka | Full wiring needed |
| Cross-layer security | `@SpringBootTest` | `@PreAuthorize` needs real beans |
| Full flow / smoke test | `@SpringBootTest` | Validates bean wiring |

```java
// Full context — use when slice tests are not sufficient
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class OrderFlowIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    @DisplayName("end-to-end: create order returns 201 with location header")
    void createOrder_returnsCreatedWithLocationHeader() {
        CreateOrderRequest request = new CreateOrderRequest(1L, 2);

        ResponseEntity<OrderResponse> response = restTemplate
            .withBasicAuth("user", "password")
            .postForEntity("/api/v1/orders", request, OrderResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getHeaders().getLocation()).isNotNull();
    }
}
```

**Performance rule:** If all your tests use `@SpringBootTest`, the test suite will be too slow to run on every commit. Keep `@SpringBootTest` to < 20% of the test count; the rest should be unit or slice tests.
