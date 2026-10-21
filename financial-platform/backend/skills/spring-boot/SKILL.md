---
name: spring-boot
description: |
  Generates production-ready Spring Boot code following NMN clean architecture
  standards. Use this skill whenever the user asks to: create a Spring Boot project
  or module, generate REST endpoints, build a CRUD API, scaffold JPA entities or
  repositories, write service or repository layers, set up Spring Security or JWT
  authentication, configure application.yml or pom.xml, create DTOs or mappers,
  build a microservice, write unit or integration tests, set up a GlobalExceptionHandler,
  add pagination or filtering, configure CORS, implement clean or layered architecture
  in Java, add Flyway migrations, set up Testcontainers, write @WebMvcTest or
  @DataJpaTest tests, add Resilience4j circuit breakers, set up Kafka producers or
  consumers, configure Micrometer or OpenTelemetry, set up rate limiting, add API
  key authentication, implement RBAC or ABAC, configure HikariCP, add @Cacheable
  caching, scaffold a multi-module Maven project, or any task involving Java + Spring
  + Maven. Even if the user just says "make me an API", "add an entity", "write the
  service layer", "scaffold this feature", "generate the boilerplate", "add auth",
  "make it production-ready", or "follow NMN standards" — trigger this skill.
---

# Spring Boot Skill — NMN Standards

## Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 17 (records, sealed classes, text blocks, switch expressions, pattern matching) |
| Build | Maven 3.9+ |
| Framework | Spring Boot 3.x |
| Persistence | Spring Data JPA + Hibernate |
| Database | PostgreSQL (default — state assumption, override if user specifies) |
| Migrations | Flyway (never `ddl-auto=update` in non-local) |
| Validation | `jakarta.validation` Bean Validation 3.0 |
| Security | Spring Security 6 + JWT (`jjwt`) |
| Testing | JUnit 5 + Mockito (BDDMockito) + Testcontainers |
| Observability | Micrometer + Spring Actuator + OpenTelemetry |
| Resilience | Resilience4j (circuit breaker, retry, rate limiter, time limiter) |
| Messaging | Spring Kafka |
| API Docs | springdoc-openapi (Swagger UI) |
| Code Style | `google-java-format` — 2-space indent, never tabs |
| Logging | SLF4J + `@Slf4j` + Logback + `LogstashEncoder` (JSON in prod) |

---

## Package structure (always use this)

```
com.nmn.{projectname}/
├── controller/               ← @RestController + ResponseEntity<T> only
├── service/
│   ├── {Feature}Service.java              ← interface with Javadoc
│   └── impl/{Feature}ServiceImpl.java     ← @Service implementation
├── repository/               ← extends JpaRepository<Entity, ID>
├── model/                    ← @Entity only — zero business logic
├── dto/
│   ├── request/              ← @Valid-annotated inbound payloads
│   └── response/             ← outbound DTOs (Java records preferred)
├── mapper/                   ← entity ↔ DTO conversion
├── exception/                ← AppException hierarchy + GlobalExceptionHandler
├── config/                   ← SecurityConfig, CorsConfig, OpenApiConfig, ClientConfig
├── filter/                   ← OncePerRequestFilter subclasses (MDC, rate limit, security headers)
├── event/                    ← Kafka event records + publishers + consumers
└── client/                   ← RestClient-based typed HTTP clients for external services
```

---

## Hard rules — enforce on every single generation

1. **Constructor injection only** — never `@Autowired` on fields; use `@RequiredArgsConstructor` or explicit constructors
2. **DTO boundary** — entities must never leave the service layer; always map to a response DTO before returning from a controller
3. **Service interface + impl** — always create `{Feature}Service` interface and `{Feature}ServiceImpl` in `impl/`
4. **`ResponseEntity<T>` everywhere** — all controller methods return `ResponseEntity<T>`, never raw types
5. **`BigDecimal` from String for money** — `new BigDecimal("19.99")` — never `double`, `float`, or `new BigDecimal(19.99)`
6. **`@Valid` on every `@RequestBody`** — without exception
7. **Java 17+ features** — records for immutable response DTOs, `Optional` over null returns, switch expressions, text blocks for multi-line strings
8. **Explicit column constraints** — `@Column(nullable = false, length = 255)` on every entity field
9. **Flyway for all schema changes** — never `spring.jpa.hibernate.ddl-auto=update` in non-local environments
10. **No `@Data` on entities** — use `@Getter`/`@Setter` only; Lombok `@Data` generates broken `equals`/`hashCode` for JPA entities
11. **Audit fields on every entity** — `createdAt`/`updatedAt` with `@CreationTimestamp`/`@UpdateTimestamp` unless user opts out
12. **`@Slf4j` + SLF4J `{}` placeholders** — never `System.out.println` or string concatenation in log statements
13. **`@Transactional` on public methods only** — private methods are silently ignored by Spring AOP
14. **`SecureRandom` for all security tokens** — never `java.util.Random`
15. **Typed `AppException` subclasses** — never catch and swallow silently; never throw bare `RuntimeException`
16. **`@PreAuthorize` at the service layer** — not just the controller layer
17. **`@JsonIgnore` on sensitive entity fields** — `passwordHash` and any credential field must never be serialised
18. **`MDC.clear()` in filter `finally` blocks** — always; thread pool reuse bleeds MDC into next request

---

## Generation order — follow every time

When asked to implement a feature, generate files in this exact order:

1. `model/{Entity}.java` — JPA entity with validation annotations + audit fields
2. `dto/request/{Entity}Request.java` — inbound DTO (record or class with `@Valid`)
3. `dto/response/{Entity}Response.java` — outbound DTO (Java record preferred)
4. `repository/{Entity}Repository.java` — JpaRepository + custom derived queries
5. `mapper/{Entity}Mapper.java` — `toEntity()` and `toResponse()` methods
6. `service/{Entity}Service.java` — interface with Javadoc on every method
7. `service/impl/{Entity}ServiceImpl.java` — `@Service` implementation
8. `controller/{Entity}Controller.java` — REST endpoints + OpenAPI annotations
9. `exception/` — custom exception classes if new error types are needed
10. Ask user before generating tests — they may want them as a separate step

---

## Error handling pattern (always follow)

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

- Services throw typed subclasses — never import `HttpStatus` in service layer
- `GlobalExceptionHandler` (@RestControllerAdvice) maps all exceptions to `ApiErrorResponse`
- Never try/catch in controllers — let `GlobalExceptionHandler` handle everything
- Log WARN for expected errors (4xx), ERROR for unexpected errors (5xx) — in the handler only
- See `skills/common/error-handling.md` for full `GlobalExceptionHandler` template

---

## Standard API response shapes

Single resource — flat DTO, no envelope wrapper:
```json
{
  "id": 1,
  "name": "Product A",
  "price": "19.99",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

Error:
```json
{
  "status": 404,
  "errorCode": "NOT_FOUND",
  "message": "Order '42' not found",
  "path": "/api/v1/orders/42",
  "timestamp": "2026-01-15T10:30:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "fieldViolations": null
}
```

Validation error:
```json
{
  "status": 422,
  "errorCode": "VALIDATION_ERROR",
  "message": "Request validation failed.",
  "path": "/api/v1/users",
  "timestamp": "2026-01-15T10:30:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "fieldViolations": [
    { "field": "email", "message": "Invalid email format." }
  ]
}
```

---

## Reference files — load only when relevant

| File | Load when |
|------|-----------|
| `skills/common/code-style.md` | Any Java code generation |
| `skills/common/code-style-index.md` | Quick rule lookup — section map |
| `skills/common/error-handling.md` | GlobalExceptionHandler, AppException hierarchy, ApiErrorResponse |
| `skills/common/security.md` | JWT, Spring Security 6, OAuth2, `@PreAuthorize`, RBAC, password hashing, security headers |
| `skills/common/api-auth.md` | JWT lifecycle, OAuth2 flows, RBAC/ABAC, API key management, service-to-service auth |
| `skills/common/testing.md` | JUnit 5, Mockito BDDMockito, `@DataJpaTest`, `@WebMvcTest`, Testcontainers |
| `skills/common/data-migrations.md` | Flyway migrations, zero-downtime patterns, backfills |
| `skills/common/logging.md` | SLF4J, MDC setup, `LogstashEncoder`, structured fields, no-PII rules |
| `skills/common/performance.md` | `@Cacheable`, N+1 prevention with `@EntityGraph`, HikariCP tuning, `Pageable` |
| `skills/common/observability.md` | Micrometer metrics, Actuator endpoints, OpenTelemetry traces, MDC correlation |
| `skills/common/microservices.md` | `RestClient` typed clients, Resilience4j circuit breaker, Spring Cloud Contract, Kafka events, Saga pattern |
| `skills/common/deployment.md` | Multi-stage Docker (distroless), layered JAR, health probes, graceful shutdown |
| `skills/common/ci-cd.md` | GitHub Actions pipeline, JaCoCo gate, OWASP Dependency Check, Checkstyle, SpotBugs |
| `skills/common/dependency-management.md` | pom.xml discipline, BOM imports, dependency scopes, conflict resolution |
| `skills/common/folder-structure.md` | Single-module and multi-module Maven layouts, Flyway naming conventions |

---

## Assets

- `assets/pom-template.xml` — base `pom.xml` with all standard NMN dependencies pre-configured
- `assets/application-template.yml` — base `application.yml` with datasource, JPA, Flyway, JWT, Actuator, logging config

---

## Behaviour notes

- Default to PostgreSQL if database not specified — state the assumption explicitly before generating
- Default to Spring MVC — ask if user wants WebFlux before generating reactive code
- For "simple/quick" requests: inline mapping in the service layer and note the trade-off
- Always confirm the base package name (`com.nmn.{projectname}`) before generating the first file
- Add `@Operation` and `@ApiResponse` OpenAPI annotations to all controller methods
- Use `Page<T>` + `Pageable` for any list endpoint that could return more than 20 records
- Add `createdAt`/`updatedAt` audit fields to every entity unless user explicitly says not to
- For any new endpoint touching user data, remind the user to check `skills/common/security.md` Section 11 checklist before merging
