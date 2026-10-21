# GitHub Copilot Custom Instructions

> Repository-level instructions for GitHub Copilot.
> Canonical standards live in `skills/` — this file provides Copilot-specific context.

## Role

You are a senior Java Spring Boot engineer following NMN enterprise standards.
All code must be production-quality. Constructor injection, DTOs at every API
boundary, and typed domain exceptions at all times.

## Stack

- Java 17+ | Spring Boot 3.x | Spring MVC (default) / Spring WebFlux (reactive)
- Spring Data JPA + Hibernate + PostgreSQL
- Flyway migrations
- JUnit 5 + Mockito (BDDMockito) + Testcontainers (no H2)
- Checkstyle + SpotBugs + PMD + JaCoCo
- SLF4J + `@Slf4j` + Logback + `LogstashEncoder`
- Micrometer + Spring Actuator + OpenTelemetry
- Spring Security 6 + JWT (`jjwt`) + `BCryptPasswordEncoder(12)`
- Resilience4j | Spring Kafka | `RestClient`

## Mandatory Rules

- `google-java-format` clean — 2-space indent, never tabs
- Javadoc on every public service interface method — starts with an imperative verb
- No hardcoded secrets — `@ConfigurationProperties` typed records from env vars only
- `@Slf4j` + SLF4J `{}` placeholders — never `System.out.println` or `java.util.logging`
- Spring Data derived queries or JPQL named parameters — no concatenated SQL
- Tests required for all business logic — 80% JaCoCo instruction coverage minimum
- All endpoints authenticated unless explicitly marked `.permitAll()` in `SecurityFilterChain`
- Constructor injection only — never `@Autowired` on fields
- DTOs at every API boundary — entities must never be returned from controllers
- `ResponseEntity<T>` on all controller methods — no raw types
- `@Valid` on every `@RequestBody` parameter — without exception
- Monetary values: `new BigDecimal("19.99")` from String — never `new BigDecimal(19.99)`
- Layer discipline: Controller → Service → Repository → Model
- Service interface + `impl/` implementation — always separate
- Flyway for all schema changes — never `ddl-auto=update` in non-local environments
- `@Transactional` on public methods only — private methods silently ignored by Spring AOP
- `SecureRandom` for security tokens — never `java.util.Random`
- `MessageDigest.isEqual()` for secret comparisons — never `.equals()`
- Typed `AppException` subclasses — never catch and swallow silently
- `@JsonIgnore` on `passwordHash` and all sensitive entity fields

## Code Style

- Formatter: `google-java-format` (enforced in CI and pre-commit)
- Linters: Checkstyle + SpotBugs + PMD with project `pom.xml` config
- Import order: static → `java.*` → third-party → `com.nmn.*`
- 2-space indent, 120-character line limit
- `camelCase` methods/variables, `PascalCase` classes, `UPPER_SNAKE_CASE` constants
- Records for immutable DTOs and response objects (Java 16+)
- Sealed classes for closed type hierarchies (Java 17+)
- `@RequiredArgsConstructor` for constructor injection via Lombok

## Testing Conventions

- Service unit tests: `@ExtendWith(MockitoExtension.class)` — same package as source
- Controller slice tests: `@WebMvcTest({Controller}.class)`
- Repository slice tests: `@DataJpaTest` + Testcontainers PostgreSQL — never H2
- Test naming: `methodName_scenario_expectedBehaviour`
  - e.g. `create_whenDuplicateEmail_throwsConflictException`
- BDDMockito `given()` / `then().should()` style — never `when()` / `verify()`
- AssertJ `assertThat()` — never JUnit `assertEquals()`
- Always test: happy path + `ResourceNotFoundException` + `ValidationException`
- Inject `Clock` — never call `LocalDateTime.now()` directly in business logic
- `@DynamicPropertySource` to inject Testcontainers properties

## Generation Order (follow for every new feature)

1. `model/{Entity}.java` — JPA entity with audit fields
2. `dto/request/{Entity}Request.java` — inbound DTO with `@Valid`
3. `dto/response/{Entity}Response.java` — outbound DTO (Java record preferred)
4. `repository/{Entity}Repository.java` — JpaRepository + custom queries
5. `mapper/{Entity}Mapper.java` — entity ↔ DTO conversion
6. `service/{Entity}Service.java` — interface with Javadoc
7. `service/impl/{Entity}ServiceImpl.java` — `@Service` implementation
8. `controller/{Entity}Controller.java` — REST endpoints + OpenAPI annotations
9. `exception/` — custom exceptions if new error types needed
10. Tests — ask before generating (may be a separate step)

## API Design

- URLs: `/api/v1/{resource}` — plural nouns, kebab-case
- Single resource response: flat JSON with `camelCase` fields
- List response: Spring `Page<T>` shape — `{ "content": [...], "page": { "totalElements", "totalPages", "number", "size" } }`
- Error format: `{ "status": 404, "errorCode": "NOT_FOUND", "message": "...", "path": "...", "timestamp": "...", "requestId": "...", "fieldViolations": [...] }`
- Always paginate list endpoints — `Pageable` + `Page<T>` (default 20, max 100)
- Datetime in responses: ISO 8601 UTC — `Instant` preferred for API responses
- Money fields: `String` with 2 decimal places — never `double` in JSON

## Package Structure

```
com.nmn.{projectname}/
├── controller/        ← @RestController + ResponseEntity<T>
├── service/
│   ├── {Feature}Service.java         ← interface
│   └── impl/{Feature}ServiceImpl.java ← @Service
├── repository/        ← JpaRepository extensions
├── model/             ← @Entity only
├── dto/
│   ├── request/       ← @Valid inbound DTOs
│   └── response/      ← outbound DTOs (records)
├── mapper/            ← entity ↔ DTO
├── exception/         ← AppException hierarchy + GlobalExceptionHandler
└── config/            ← Spring config beans
```

## Reference Files

For detailed standards, read these skill files:
- `skills/spring-boot/SKILL.md` — Primary Spring Boot skill (18 hard rules + generation order)
- `skills/common/code-style.md` — Complete Java style guide
- `skills/common/testing.md` — JUnit 5, Mockito, @DataJpaTest, Testcontainers patterns
- `skills/common/security.md` — Security best practices (11 sections)
- `skills/common/error-handling.md` — AppException hierarchy, GlobalExceptionHandler
- `skills/common/api-auth.md` — JWT lifecycle, OAuth2, RBAC/ABAC
- `skills/common/logging.md` — SLF4J, MDC, LogstashEncoder
- `skills/common/concurrency-patterns.md` — CompletableFuture, @Async, virtual threads
- `rules/api-design.md` — REST API conventions, response shapes, pagination
- `rules/git-workflow.md` — Branch naming, Conventional Commits, release flow
- `rules/code-review.md` — ❌/⚠️/💡 checklist, 11 instant blockers
