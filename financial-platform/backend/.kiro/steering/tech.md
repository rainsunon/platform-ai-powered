# Technology Stack

## Language & Runtime

- **Java 17+** (check `<java.version>` in `pom.xml` before using version-specific syntax).
- Static analysis: SpotBugs, PMD (via Maven plugins).
- Linting / formatting: `google-java-format` (via Spotless Maven plugin), Checkstyle.
- Vulnerability scanning: OWASP Dependency-Check Maven plugin.

## Frameworks (project-specific — load the relevant `SKILL.md`)

| Framework | Skill file | Use case |
|-----------|-----------|----------|
| Spring Boot 3.x (MVC) | `skills/spring-boot/SKILL.md` | Standard REST APIs |
| Spring WebFlux | `skills/spring-webflux/SKILL.md` | Reactive / high-concurrency APIs |
| Spring Kafka | `skills/kafka/SKILL.md` | Event-driven producers and consumers |
| grpc-java + Spring Boot | `skills/grpc/SKILL.md` | Internal microservice communication |

## Core Libraries

| Purpose | Library | Notes |
|---------|---------|-------|
| Web framework | `spring-boot-starter-web` | Spring MVC; embedded Tomcat |
| ORM | `spring-boot-starter-data-jpa` + Hibernate | See `skills/common/db-design.md` |
| DB driver | `postgresql` (JDBC) | Postgres-native |
| Connection pool | HikariCP (Spring Boot default) | Always pool — never per-request connect |
| Migrations | Flyway | See `skills/common/data-migrations.md` |
| Validation | Jakarta Bean Validation + `spring-boot-starter-validation` | `@Valid` on all request bodies |
| Config | `@ConfigurationProperties` typed records | Env vars into typed beans — never raw `System.getenv()` |
| Logging | SLF4J + Logback + Logstash encoder | Never `System.out.println` — see `skills/common/logging.md` |
| HTTP client | `RestClient` (sync, Spring Boot 3.2+) / `WebClient` (reactive) with timeouts | Always set `connectTimeout` and `readTimeout` |
| Testing | JUnit 5 + Mockito + AssertJ + Testcontainers | See `skills/common/testing.md` |
| Async / scheduling | `@Async` + `ThreadPoolTaskExecutor` / virtual threads (Java 21+) | See `skills/common/concurrency-patterns.md` |
| Observability | Micrometer + OpenTelemetry + Spring Actuator | See `skills/common/observability.md` |
| Money | `BigDecimal` (from String constructor) | Never `double` or `float` for money |
| JWT | `io.jsonwebtoken:jjwt-api` | See `skills/common/api-auth.md` |
| Password hashing | `BCryptPasswordEncoder` (strength ≥12) or `Argon2PasswordEncoder` | See `skills/common/security.md` |
| Rate limiting | `bucket4j-redis` | See `skills/common/security.md` |
| Resilience | `resilience4j-spring-boot3` | Circuit breaker, retry, bulkhead |
| Messaging | `spring-kafka` | See `skills/kafka/SKILL.md` |

## Architecture Principles

- Layer discipline: Controller → Service → Repository → Model.
- 12-factor app compliance (see `skills/common/deployment.md`).
- Domain exceptions mapped to HTTP at `GlobalExceptionHandler` boundary (see `skills/common/error-handling.md`).
- All endpoints authenticated via Spring Security unless explicitly marked `.permitAll()`.
- DTOs at every API boundary — entities never returned from controllers.
- Constructor injection only — never `@Autowired` on fields.

## Development Tools

- Git workflow: Conventional Commits, squash merge (see `rules/git-workflow.md`).
- CI: GitHub Actions (see `skills/common/ci-cd.md`).
- Containers: distroless multi-stage builds (see `skills/common/deployment.md`).
- pre-commit hooks: `google-java-format`, `checkstyle`, `mvn test`, `mvn dependency-check:check`.
