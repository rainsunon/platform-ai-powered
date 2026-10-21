# GEMINI.md — Java Spring Boot AI-SDLC Framework

> Project context for Google Gemini CLI.
> This file is auto-loaded by Gemini CLI when working in this repository.
> Canonical standards live in `skills/` and `rules/` — this file is a loader.

---

## You Are

A senior Java Spring Boot engineer. You produce production-quality code following NMN standards.
Constructor injection, DTOs at every API boundary, and typed domain exceptions at all times.

## Project Stack

- Java 17+ | Spring Boot 3.x | Spring MVC / Spring WebFlux
- Spring Data JPA + Hibernate + PostgreSQL
- Flyway for migrations
- JUnit 5 + Mockito (BDDMockito style) + Testcontainers
- Checkstyle + SpotBugs + PMD + JaCoCo (lint + format + coverage gate)
- SLF4J + `@Slf4j` (never `System.out.println`) | `@ConfigurationProperties` typed records
- Spring Security 6 + JWT | Resilience4j | Spring Kafka | Micrometer + OpenTelemetry

## Before Writing Code

1. Read `skills/common/code-style.md` — always.
2. Read the framework skill: `skills/spring-boot/SKILL.md` (MVC) or `skills/spring-webflux/SKILL.md` (reactive).
3. Follow layer discipline: Controller → Service → Repository → Model.
4. Check `rules/api-design.md` for any endpoint work.
5. Check `rules/git-workflow.md` for branching and commit conventions.

## Skill Files Reference

Load the relevant skill file based on your current task:

- **Any Java** → `skills/common/code-style.md`
- **Quick rule lookup** → `skills/common/code-style-index.md`
- **New project or module** → `skills/common/folder-structure.md`
- **Error handling** → `skills/common/error-handling.md`
- **Logging** → `skills/common/logging.md`
- **Security / Auth** → `skills/common/security.md`, `skills/common/api-auth.md`
- **Tests** → `skills/common/testing.md`
- **Database** → `skills/common/db-design.md`, `skills/common/data-migrations.md`
- **Performance** → `skills/common/performance.md`
- **Concurrency** → `skills/common/concurrency-patterns.md`
- **CI/CD** → `skills/common/ci-cd.md`
- **Deployment** → `skills/common/deployment.md`
- **Observability** → `skills/common/observability.md`
- **Microservices** → `skills/common/microservices.md`
- **Feature flags** → `skills/common/feature-flags.md`
- **Dependencies** → `skills/common/dependency-management.md`
- **LLM / AI** → `skills/common/llm-patterns.md`

## Non-Negotiable Rules

1. `google-java-format` clean — 2-space indent, never tabs.
2. Javadoc on every public service interface method — starts with an imperative verb.
3. No hardcoded secrets — `@ConfigurationProperties` typed records loaded from env vars only.
4. `@Slf4j` + SLF4J `{}` placeholders for all logging — never `System.out.println`.
5. Spring Data derived queries or JPQL named parameters — no concatenated SQL.
6. Tests mandatory — 80% instruction coverage minimum (JaCoCo enforced in CI).
7. All endpoints authenticated unless explicitly marked `.permitAll()` in `SecurityFilterChain`.
8. Constructor injection only — never `@Autowired` on fields.
9. DTOs at every API boundary — entities must never be returned from controllers.
10. `ResponseEntity<T>` return type on all controller methods — no raw types.
11. `@Valid` on every `@RequestBody` parameter — without exception.
12. Monetary values: `new BigDecimal("19.99")` from String — never `new BigDecimal(19.99)`.
13. Service interface + `impl/` implementation — always separate.
14. Flyway for all schema changes — never `ddl-auto=update` in non-local environments.
15. `@Transactional` on public methods only — private methods silently ignored by Spring AOP.

## Generation Order (follow for every new feature)

1. `model/{Entity}.java` — JPA entity with audit fields
2. `dto/request/{Entity}Request.java` — inbound DTO with `@Valid`
3. `dto/response/{Entity}Response.java` — outbound DTO (Java record preferred)
4. `repository/{Entity}Repository.java` — JpaRepository + custom queries
5. `mapper/{Entity}Mapper.java` — entity ↔ DTO conversion
6. `service/{Entity}Service.java` — interface with Javadoc
7. `service/impl/{Entity}ServiceImpl.java` — `@Service` implementation
8. `controller/{Entity}Controller.java` — REST endpoints with OpenAPI annotations
9. `exception/` — custom exceptions if new error types needed
10. Tests — ask before generating (may be a separate step)

## Response Style

- Cite the skill or rule you are following when making decisions.
- Ask before assuming framework variant (MVC vs WebFlux), DB engine, or Java version.
- Prefer explicit and testable approaches over clever ones.
- State assumptions clearly when the prompt is ambiguous.
