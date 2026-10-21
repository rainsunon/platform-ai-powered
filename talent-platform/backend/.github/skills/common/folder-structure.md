# Java Project Structure — Enterprise Standard

**Applies to:** All Java Spring Boot project types.
**Version:** Java 17+. Version-specific options noted per section.

---

## SECTION 1 — THE CORE PRINCIPLE

There is no universal folder structure — there are structures suited to the problem. This skill defines invariant rules that govern any structure, plus canonical layouts for the five most common Java Spring Boot project archetypes:

1. **Web service** (Spring MVC REST API)
2. **Library / module** (published to Maven Central or internal Nexus/Artifactory)
3. **Data pipeline / ETL worker** (Spring Batch)
4. **CLI tool** (Spring Shell / PicoCLI)
5. **gRPC microservice** (grpc-java + Spring Boot)

**Invariants — apply to every project regardless of archetype:**
- One `pom.xml` at root. `groupId` + `artifactId` is the canonical Maven coordinate.
- `src/main/java/{package}/Application.java` is the **only** class with `public static void main`.
- Application code lives under a single root package (e.g. `com.nmn.myservice`) — sub-packages are import-visible by default; use package-private access to limit scope.
- Reusable code extracted to a separate Maven module or library artifact — not copy-pasted.
- `.env.example` committed, `.env` never committed.
- No business logic in `@PostConstruct` or static initialisers.
- No circular dependencies between packages — ArchUnit enforces this in CI.

---

## SECTION 2 — PACKAGE VISIBILITY vs MODULE BOUNDARIES

### 2.1 Root package — for all application code

All code lives under the root package defined in the `groupId`/`artifactId`:

```
com.nmn.myservice/
├── Application.java
├── api/
├── service/
└── repository/
```

Java enforces access boundaries through visibility modifiers and tooling. Apply the following layers of protection:
- **Package-private classes** — no `public` modifier where not needed.
- **ArchUnit** — layering rules asserted in tests (see §3 Layer Responsibility Contract).
- **Multi-module Maven** — split into `api`, `service`, `repository` Maven modules for hard compile-time boundaries in large monorepos.

### 2.2 Shared library module — for genuinely reusable code

Only extract to a shared library when it is consumed by more than one service. If unsure — keep it in the service. Moving in is trivial; extracting a library means versioning and publishing.

### 2.3 Flat layout — for tiny libraries / starters

A single-purpose Spring Boot starter or utility library:

```
my-spring-starter/
├── src/main/java/com/nmn/starter/
│   ├── MyAutoConfiguration.java
│   └── MyProperties.java
├── src/main/resources/META-INF/spring/
│   └── org.springframework.boot.autoconfigure.AutoConfiguration.imports
└── pom.xml
```

---

## SECTION 3 — WEB SERVICE LAYOUT

```
my-service/
├── src/
│   ├── main/
│   │   ├── java/com/nmn/myservice/
│   │   │   │
│   │   │   ├── Application.java                  ← entry point — @SpringBootApplication
│   │   │   │
│   │   │   ├── api/                              ← HTTP layer; controllers, filters, routes
│   │   │   │   ├── filter/
│   │   │   │   │   ├── AuthFilter.java
│   │   │   │   │   ├── LoggingFilter.java
│   │   │   │   │   └── RequestIdFilter.java
│   │   │   │   ├── v1/
│   │   │   │   │   ├── UserController.java       ← @RestController; delegates to service
│   │   │   │   │   ├── OrderController.java
│   │   │   │   │   └── HealthController.java
│   │   │   │   ├── dto/                          ← request/response types (separate from models)
│   │   │   │   │   ├── request/
│   │   │   │   │   │   ├── CreateUserRequest.java
│   │   │   │   │   │   └── UpdateUserRequest.java
│   │   │   │   │   └── response/
│   │   │   │   │       ├── UserResponse.java
│   │   │   │   │       └── PageResponse.java
│   │   │   │   └── advice/
│   │   │   │       └── GlobalExceptionHandler.java  ← @RestControllerAdvice
│   │   │   │
│   │   │   ├── core/                             ← cross-cutting concerns; no domain logic
│   │   │   │   ├── config/                       ← @Configuration classes, @ConfigurationProperties
│   │   │   │   │   ├── AppProperties.java
│   │   │   │   │   ├── SecurityConfig.java
│   │   │   │   │   └── AsyncConfig.java
│   │   │   │   ├── logging/                      ← Logback config, MDC helpers
│   │   │   │   ├── exception/                    ← exception hierarchy + HTTP mapping
│   │   │   │   │   ├── AppException.java
│   │   │   │   │   ├── NotFoundException.java
│   │   │   │   │   └── ConflictException.java
│   │   │   │   ├── security/                     ← password hashing, JWT helpers
│   │   │   │   └── observability/                ← Micrometer, OTel, custom metrics
│   │   │   │
│   │   │   ├── model/                            ← JPA entities; domain types + invariants
│   │   │   │   ├── BaseEntity.java               ← @MappedSuperclass with audit fields
│   │   │   │   ├── User.java
│   │   │   │   └── Order.java
│   │   │   │
│   │   │   ├── repository/                       ← Spring Data interfaces; no business logic
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── UserRepositoryCustom.java     ← custom query interface
│   │   │   │   ├── UserRepositoryImpl.java       ← Criteria API / JPQL implementation
│   │   │   │   └── OrderRepository.java
│   │   │   │
│   │   │   ├── service/                          ← business logic; orchestrates repositories
│   │   │   │   ├── UserService.java              ← interface
│   │   │   │   ├── UserServiceImpl.java          ← @Service implementation
│   │   │   │   ├── OrderService.java
│   │   │   │   └── OrderServiceImpl.java
│   │   │   │
│   │   │   └── worker/                           ← background jobs, scheduled tasks, consumers
│   │   │       ├── EmailWorker.java
│   │   │       └── ReconciliationWorker.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml                   ← base config
│   │       ├── application-local.yml             ← local dev overrides
│   │       ├── application-prod.yml              ← prod overrides (secrets via env vars)
│   │       ├── db/migration/                     ← Flyway SQL migrations
│   │       │   ├── V1__create_tenants.sql
│   │       │   └── V2__create_users.sql
│   │       └── logback-spring.xml                ← JSON structured logging
│   │
│   └── test/
│       ├── java/com/nmn/myservice/
│       │   ├── api/v1/
│       │   │   └── UserControllerTest.java       ← @WebMvcTest slice
│       │   ├── service/
│       │   │   └── UserServiceTest.java          ← @ExtendWith(MockitoExtension.class)
│       │   ├── repository/
│       │   │   └── UserRepositoryTest.java       ← @DataJpaTest slice
│       │   ├── integration/
│       │   │   └── UserIntegrationTest.java      ← @SpringBootTest + Testcontainers
│       │   └── arch/
│       │       └── LayerArchTest.java            ← ArchUnit layering rules
│       └── resources/
│           └── application-test.yml
│
├── deploy/                                       ← Dockerfile, k8s manifests, Helm charts
├── .github/workflows/
├── docs/
│   ├── adr/                                      ← Architecture Decision Records
│   └── runbooks/
├── pom.xml
├── .env.example
├── checkstyle.xml
├── .editorconfig
└── README.md
```

### Layer Responsibility Contract

| Layer | Location | Sole Responsibility | May import from | Must NOT import from |
|---|---|---|---|---|
| Controller | `api/v1/` | HTTP, validation, serialisation | Services, DTOs, core | Repositories, Models directly |
| Service | `service/` | Business logic, domain rules | Repositories, Models, core | API layer, DB drivers, DTOs |
| Repository | `repository/` | DB queries, JPA operations | Models, JPA | Services, API, DTOs |
| Model | `model/` | JPA entities, domain invariants | JPA annotations, stdlib | Anything above |
| DTO | `api/dto/` | Request / response shapes | Models (for mapping) | Services, Repositories |
| Core | `core/` | Config, exceptions, logging, telemetry | stdlib, Spring, third-party | Anything in `api/`, `service/`, `repository/` |

**Enforce with ArchUnit** — add to `src/test/java/.../arch/LayerArchTest.java`:

```java
// src/test/java/com/nmn/myservice/arch/LayerArchTest.java
package com.nmn.myservice.arch;

import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

class LayerArchTest {

    private static final String ROOT = "com.nmn.myservice";

    @Test
    void controllers_should_not_access_repositories_directly() {
        ArchRule rule = noClasses()
            .that().resideInAPackage(ROOT + ".api..")
            .should().dependOnClassesThat()
            .resideInAPackage(ROOT + ".repository..");
        rule.check(new ClassFileImporter().importPackages(ROOT));
    }

    @Test
    void services_should_not_depend_on_api_layer() {
        ArchRule rule = noClasses()
            .that().resideInAPackage(ROOT + ".service..")
            .should().dependOnClassesThat()
            .resideInAPackage(ROOT + ".api..");
        rule.check(new ClassFileImporter().importPackages(ROOT));
    }

    @Test
    void repositories_should_not_contain_business_logic_indicators() {
        ArchRule rule = noClasses()
            .that().resideInAPackage(ROOT + ".repository..")
            .should().dependOnClassesThat()
            .resideInAPackage(ROOT + ".service..");
        rule.check(new ClassFileImporter().importPackages(ROOT));
    }
}
```

**Canonical violations to never generate:**

```java
// VIOLATION — controller calling repository directly (skips service)
@RestController
public class UserController {
    private final UserRepository userRepository;   // ❌ inject repository directly

    @GetMapping("/users/{id}")
    public User getUser(@PathVariable Long id) {
        return userRepository.findById(id).orElseThrow();  // bypasses business logic
    }
}

// VIOLATION — service importing from api/dto layer
import com.nmn.myservice.api.dto.request.CreateUserRequest;

@Service
public class UserServiceImpl {
    public User create(CreateUserRequest request) { ... }  // ❌ service knows about DTOs
}

// VIOLATION — repository containing business logic
@Repository
public class UserRepositoryImpl {
    public List<User> getEligibleDiscountUsers() {
        // ❌ "eligible discount" is a business rule; belongs in UserService
    }
}

// VIOLATION — @Autowired field injection (use constructor injection)
@Service
public class UserServiceImpl {
    @Autowired
    private UserRepository userRepository;    // ❌ hides dependencies, untestable
}
```

---

## SECTION 4 — LIBRARY / MODULE LAYOUT

```
my-spring-library/
├── src/
│   ├── main/java/com/nmn/library/
│   │   ├── MyClient.java               ← exported API surface
│   │   ├── MyClientProperties.java     ← @ConfigurationProperties
│   │   ├── MyClientAutoConfiguration.java  ← @AutoConfiguration
│   │   └── internal/                   ← package-private implementation
│   │       ├── transport/
│   │       └── parser/
│   ├── main/resources/META-INF/spring/
│   │   └── org.springframework.boot.autoconfigure.AutoConfiguration.imports
│   └── test/java/com/nmn/library/
│       └── MyClientTest.java
├── CHANGELOG.md
├── pom.xml
└── README.md
```

**Library-specific rules:**

- Public API surface is what is `public` at the top-level package. Everything else is package-private or under `internal/` sub-package.
- Use the **builder pattern** or `@ConfigurationProperties` for extensibility:
  ```java
  MyClient client = MyClient.builder()
      .timeout(Duration.ofSeconds(10))
      .retries(3)
      .build();
  ```
- `package-info.java` carries the package Javadoc if documentation is extensive.
- Semantic versioning via Maven `<version>`. Breaking changes bump the major version; use a separate `artifactId` suffix (`-v2`) for multi-version support.

---

## SECTION 5 — DATA PIPELINE / SPRING BATCH LAYOUT

```
my-pipeline/
├── src/main/java/com/nmn/pipeline/
│   ├── Application.java
│   │
│   ├── job/                            ← Spring Batch Job configurations
│   │   ├── ExtractJobConfig.java       ← one @Bean Job per pipeline stage
│   │   ├── TransformJobConfig.java
│   │   └── LoadJobConfig.java
│   │
│   ├── source/                         ← ItemReader implementations
│   │   ├── PostgresItemReader.java
│   │   └── S3ItemReader.java
│   │
│   ├── transform/                      ← ItemProcessor — pure transformation
│   │   ├── NormaliseProcessor.java
│   │   └── ValidateProcessor.java
│   │
│   ├── sink/                           ← ItemWriter implementations
│   │   └── WarehouseItemWriter.java
│   │
│   ├── model/                          ← data contracts (input/output records)
│   │   ├── RawRecord.java
│   │   └── ProcessedRecord.java
│   │
│   └── core/
│       └── BatchConfig.java            ← DataSource, JobRepository, PlatformTransactionManager
│
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/
├── schemas/                            ← JSON Schema / Avro / Protobuf
├── data/samples/                       ← small samples for tests (committed)
└── pom.xml
```

---

## SECTION 6 — CLI TOOL LAYOUT (Spring Shell)

```
my-cli/
├── src/main/java/com/nmn/cli/
│   ├── Application.java
│   │
│   ├── command/                        ← @ShellComponent classes (Spring Shell)
│   │   ├── DeployCommand.java
│   │   └── StatusCommand.java
│   │
│   ├── core/
│   │   ├── AppProperties.java
│   │   └── AppException.java
│   │
│   └── output/                         ← formatters: plain text, JSON, table
│       ├── TableFormatter.java
│       └── JsonFormatter.java
│
├── src/main/resources/
│   └── application.yml
├── pom.xml
└── README.md

# Build fat JAR for distribution
# mvn package → target/my-cli.jar
# java -jar my-cli.jar deploy --env prod
```

---

## SECTION 7 — gRPC MICROSERVICE LAYOUT

```
my-grpc-service/
├── src/
│   ├── main/
│   │   ├── java/com/nmn/grpc/
│   │   │   ├── Application.java
│   │   │   ├── server/                 ← gRPC service implementations
│   │   │   │   └── UserGrpcService.java  ← extends UserServiceGrpc.UserServiceImplBase
│   │   │   ├── interceptor/            ← auth, logging, exception mapping
│   │   │   │   ├── AuthInterceptor.java
│   │   │   │   └── LoggingInterceptor.java
│   │   │   ├── service/
│   │   │   ├── repository/
│   │   │   ├── model/
│   │   │   └── core/
│   │   └── resources/
│   │       └── application.yml
│   └── proto/                          ← .proto files (source of truth)
│       └── v1/user.proto
├── pom.xml                             ← protobuf-maven-plugin generates code into target/
└── README.md
```

Add `protobuf-maven-plugin` to `pom.xml` — generated code lands in `target/generated-sources/protobuf/java/`.

---

## SECTION 8 — FILE AND PACKAGE NAMING RULES

```
Packages:    lowercase, no underscores, single meaningful word; match directory name
             user, order, payment ✓    userService ✗    user_service ✗

Classes:     PascalCase; noun for entities/services, adjective+noun for configs
             UserService, OrderRepository, SecurityConfig ✓
             UserSrvc, Util ✗

Interfaces:  PascalCase noun (NOT prefixed with I)
             UserService ✓    IUserService ✗

Implementations: suffix Impl only when the interface and implementation live together
             UserServiceImpl ✓ (for UserService interface)

Files:       one top-level public class per file; filename matches class name exactly
             UserService.java ✓    user_service.java ✗

Tests:       same name + Test suffix
             UserService.java → UserServiceTest.java
             Integration tests: UserServiceIT.java (picked up by Failsafe, not Surefire)

Generated:   suffix Gen or place in target/ — never commit generated source
             QueryDSL: QUser.java lives in target/generated-sources/

Never shadow JDK class names: don't name a class Optional, List, or String
```

---

## SECTION 9 — WHAT NEVER GOES WHERE

| Location | Forbidden |
|---|---|
| `api/v1/` controllers | SQL queries, business rules, role-check logic beyond `@PreAuthorize` |
| `service/` | `@Repository` beans, `HttpServletRequest`, framework-specific HTTP types |
| `repository/` | Business validation, external API calls, email sending |
| `model/` | I/O operations, `@Service` / `@Component` annotations, calls to other layers |
| `api/dto/` | `@Entity` annotations, DB queries, service calls |
| `core/` | Domain logic; controller/service/repository-specific code |
| `@PostConstruct` / static blocks | Network calls, DB connections, blocking I/O |
| Test classes | Production code paths, `@SpringBootApplication` class redefinition |
| `application.yml` | Secrets (passwords, tokens) — use env vars or Vault |
| `Application.java` | Anything but `SpringApplication.run()` and minimal bean wiring |

---

## SECTION 10 — PACKAGE DESIGN RULES

### Package Names: Lowercase, Single Word, Domain-Aligned

```java
// ✅ CORRECT
package com.nmn.myservice.user;
package com.nmn.myservice.payment;
package com.nmn.myservice.httpclient;

// ❌ WRONG
package com.nmn.myservice.userService;   // MixedCaps
package com.nmn.myservice.user_service;  // underscores
package com.nmn.myservice.util;          // empty noun — what does this contain?
```

### Avoid "util" / "common" / "helpers" / "misc" Packages

These accumulate unrelated code. Split by domain instead.

```
// ❌ WRONG
com.nmn.myservice.util/
├── StringUtils.java
├── TimeUtils.java
└── HttpUtils.java    ← three unrelated concerns

// ✅ CORRECT
com.nmn.myservice.strutil/    ← string-specific helpers
com.nmn.myservice.timex/      ← time helpers
com.nmn.myservice.httpx/      ← HTTP helpers
```

### Avoid Circular Dependencies — Enforce with ArchUnit

Maven does not permit circular module dependencies. Within a single module, Spring's IoC can mask circular bean dependencies (use constructor injection — Spring fails fast on circular constructor deps).

Layer discipline prevents them:

```
api → service → repository → model → (nothing)
api → core → (stdlib + Spring only)
```

If you find yourself wanting `model` to import from `service`, the model has business logic that belongs in the service.

### @PostConstruct and Static Initialisers

Avoid side effects in `@PostConstruct` for infrastructure resources. Prefer `@Bean` factory methods and constructor injection.

```java
// ❌ WRONG — connects to external service at bean construction time; untestable
@Component
public class CacheManager {
    private RedisConnection connection;

    @PostConstruct
    public void init() {
        connection = RedisClient.connect(System.getenv("REDIS_URL")); // side effect in init
    }
}

// ✅ CORRECT — explicit @Bean; testable; replaceable in @TestConfiguration
@Configuration
public class RedisConfig {
    @Bean
    public RedisConnectionFactory redisConnectionFactory(AppProperties props) {
        return new LettuceConnectionFactory(props.redis().host(), props.redis().port());
    }
}

// Application.java wires it explicitly via Spring Boot auto-configuration
```

Acceptable `@PostConstruct` uses:
- Validating configuration after injection (`@ConfigurationProperties` + `@Validated` is better).
- Registering callbacks on already-injected beans (e.g. adding a listener to an injected `EventBus`).
- Pre-warming an in-memory cache from an already-open DB connection.
