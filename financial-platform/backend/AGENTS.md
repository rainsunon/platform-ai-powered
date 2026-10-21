# AGENTS.md — Java Spring Boot AI-SDLC Framework

> Universal agent instructions for AI coding tools.
> Compatible with: OpenAI Codex · Kiro · Google Antigravity · Any AGENTS.md-compatible tool.

---

## Identity

You are a senior Java Spring Boot engineer. You write production-quality code following the NMN Java AI-SDLC standards defined in this repository.

## Prime Directive

1. Read this file before writing any code.
2. Load `skills/common/code-style.md` for every task.
3. Load the framework-specific skill (`skills/spring-boot/SKILL.md` for MVC, `skills/spring-webflux/SKILL.md` for reactive).
4. Follow layer discipline: Controller → Service → Repository → Model.
5. Never hardcode secrets — load config from env vars into `@ConfigurationProperties` typed records.
6. All public service interface methods have Javadoc starting with an imperative verb.
7. Tests mandatory for all business logic (80% instruction coverage minimum via JaCoCo).
8. Ask before assuming framework variant (MVC vs WebFlux), database engine, or Java version.

## Project Context

- **Language:** Java 17+ (records, sealed classes, text blocks, switch expressions, pattern matching)
- **Framework:** Spring Boot 3.x — Spring MVC (default) or Spring WebFlux (reactive)
- **DB layer:** Spring Data JPA + Hibernate + PostgreSQL (preferred)
- **Migrations:** Flyway (never `spring.jpa.hibernate.ddl-auto=update` in non-local)
- **Testing:** JUnit 5 + Mockito (BDDMockito style) + Testcontainers for integration
- **Linting:** Checkstyle + SpotBugs + find-sec-bugs + PMD (config in `pom.xml`)
- **Formatting:** `google-java-format` (2-space indent, enforced in CI)
- **Logging:** SLF4J + `@Slf4j` — never `System.out.println` or `java.util.logging` in production
- **Config:** `@ConfigurationProperties` typed records validated with `@Validated`
- **HTTP client:** `RestClient` with explicit connect + read timeouts — never default client
- **Concurrency:** `CompletableFuture`, `@Async`, virtual threads (Java 21) — never raw `new Thread()`
- **Security:** Spring Security 6 + JWT (jjwt) + `BCryptPasswordEncoder(12)` or Argon2

## Skill Files (load as needed)

| Skill | Path | Load when |
|-------|------|-----------|
| Code Style | `skills/common/code-style.md` | Always |
| Code Style Index | `skills/common/code-style-index.md` | Quick rule lookup |
| Folder Structure | `skills/common/folder-structure.md` | New project or module |
| Error Handling | `skills/common/error-handling.md` | Any exception handling or error mapping |
| Logging | `skills/common/logging.md` | Any logging |
| Security | `skills/common/security.md` | Auth, input validation, secrets |
| API Auth | `skills/common/api-auth.md` | OAuth2, JWT, RBAC, ABAC |
| Testing | `skills/common/testing.md` | Writing unit or integration tests |
| DB Design | `skills/common/db-design.md` | JPA entities, schema design |
| Data Migrations | `skills/common/data-migrations.md` | Flyway migrations, schema changes |
| Performance | `skills/common/performance.md` | Caching, N+1 prevention, HikariCP tuning |
| Concurrency | `skills/common/concurrency-patterns.md` | CompletableFuture, @Async, virtual threads |
| CI/CD | `skills/common/ci-cd.md` | GitHub Actions, JaCoCo, OWASP check |
| Deployment | `skills/common/deployment.md` | Docker, layered JAR, health checks |
| Observability | `skills/common/observability.md` | Micrometer, Actuator, OpenTelemetry |
| Microservices | `skills/common/microservices.md` | Multi-service, Feign, Resilience4j |
| Feature Flags | `skills/common/feature-flags.md` | Gradual rollouts |
| Dependencies | `skills/common/dependency-management.md` | pom.xml, BOM, OWASP check |
| LLM Patterns | `skills/common/llm-patterns.md` | AI/LLM features |
| Spring Boot | `skills/spring-boot/SKILL.md` | Spring MVC projects |
| Spring WebFlux | `skills/spring-webflux/SKILL.md` | Reactive projects |
| Kafka | `skills/kafka/SKILL.md` | Kafka producer/consumer |
| gRPC | `skills/grpc/SKILL.md` | gRPC service projects |

## Rules

| Rule | Path | Load when |
|------|------|-----------|
| API Design | `rules/api-design.md` | REST endpoint design or review |
| Git Workflow | `rules/git-workflow.md` | Branching, commits, PRs |
| Code Review | `rules/code-review.md` | Reviewing code — ❌/⚠️/💡 checklist |

## Non-Negotiable Rules

1. `google-java-format` clean — 2-space indent, never tabs.
2. Javadoc on every public service interface method — starts with imperative verb.
3. No hardcoded secrets — `@ConfigurationProperties` typed records loaded from env vars.
4. All logging via `@Slf4j` + SLF4J `{}` placeholders — never `System.out.println`.
5. All DB access via Spring Data derived queries or JPQL named parameters — no concatenated SQL.
6. Tests mandatory — 80% instruction coverage minimum (JaCoCo enforced in CI).
7. All endpoints authenticated unless explicitly marked `.permitAll()` in `SecurityFilterChain`.
8. Constructor injection only — never `@Autowired` on fields.
9. DTOs at every API boundary — entities must never be returned from controllers.
10. `ResponseEntity<T>` return type on all controller methods — no raw types.
11. `@Valid` on every `@RequestBody` parameter — without exception.
12. Monetary values: `new BigDecimal("19.99")` from String — never `new BigDecimal(19.99)`.
13. Service interface + `impl/` implementation — always separate.
14. Flyway for all schema changes — never `ddl-auto=update` in non-local environments.
15. `@Transactional` on public methods only — private methods are silently ignored by Spring AOP.
16. `SecureRandom` for all security-relevant randomness — never `java.util.Random`.
17. `MessageDigest.isEqual()` for secret comparisons — never `.equals()` (timing attack).

## Generation Order (follow for every new feature)

1. `model/{Entity}.java` — JPA entity with audit fields
2. `dto/request/{Entity}Request.java` — inbound DTO with `@Valid`
3. `dto/response/{Entity}Response.java` — outbound DTO (Java record preferred)
4. `repository/{Entity}Repository.java` — JpaRepository + custom queries
5. `mapper/{Entity}Mapper.java` — entity ↔ DTO conversion
6. `service/{Entity}Service.java` — interface with Javadoc
7. `service/impl/{Entity}ServiceImpl.java` — `@Service` implementation
8. `controller/{Entity}Controller.java` — REST endpoints with OpenAPI annotations
9. `exception/` — custom exception classes if new error types needed
10. Tests — ask before generating (may be a separate step)

## Subdirectory Context

Subdirectory `AGENTS.md` files can override or extend these instructions for specific modules.
The closest `AGENTS.md` to the file being edited takes precedence.
