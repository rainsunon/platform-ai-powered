---
name: java-standards
description: NMN Java Spring Boot AI-SDLC enterprise coding standards
---

# Java Spring Boot AI-SDLC Standards

## Overview

This skill provides the NMN Java Spring Boot enterprise coding standards. All code generated must follow these standards.

## Prerequisites

- Java 17+ project
- Spring Boot 3.x
- Maven as the build tool
- One of: Spring MVC, Spring WebFlux, Spring Kafka, or gRPC

## Instructions

### Before Writing Code

1. Read `skills/common/code-style.md` — always loaded.
2. Identify the framework and read `skills/{spring-boot|spring-webflux|kafka|grpc}/SKILL.md`.
3. Follow layer discipline: Controller → Service → Repository → Model.
4. Generate in order: Entity → DTO → Repository → Mapper → Service interface → ServiceImpl → Controller → Tests.

### Non-Negotiable Rules

- `google-java-format` clean — 2-space indent, never tabs.
- Javadoc on all public service interface methods, starting with an imperative verb.
- No hardcoded secrets — `@ConfigurationProperties` typed records loaded from env vars.
- `@Slf4j` + SLF4J `{}` placeholders — never `System.out.println` or `java.util.logging`.
- Spring Data derived queries or JPQL named parameters — no string-concatenated SQL.
- Tests mandatory — 80% instruction coverage minimum (JaCoCo enforced in CI).
- All endpoints authenticated unless explicitly marked `.permitAll()` in `SecurityFilterChain`.
- Always throw typed `AppException` subclasses — never catch and swallow silently.
- Constructor injection only — never `@Autowired` on fields.
- DTOs at every API boundary — entities must never be returned from controllers.
- Monetary values: `new BigDecimal("19.99")` from String — never `double` or `float`.
- `@Transactional` on public methods only — private methods are silently ignored by Spring AOP.
- `@Valid` on every `@RequestBody` parameter — without exception.
- `ResponseEntity<T>` return type on all controller methods — no raw types.
- Flyway for all schema changes — never `ddl-auto=update` in non-local environments.
- `SecureRandom` for all security-relevant randomness — never `java.util.Random`.

### Skill Files

Load from `skills/common/` based on task:

| Task | File |
|------|------|
| Any Java | `code-style.md` |
| New project | `folder-structure.md` |
| Errors | `error-handling.md` |
| Logging | `logging.md` |
| Security | `security.md`, `api-auth.md` |
| Tests | `testing.md` |
| Database | `db-design.md`, `data-migrations.md` |
| Performance | `performance.md` |
| Concurrency | `concurrency-patterns.md` |
| CI/CD | `ci-cd.md` |
| Deploy | `deployment.md` |
| Monitoring | `observability.md` |
| Multi-service | `microservices.md` |
| Feature flags | `feature-flags.md` |
| Dependencies | `dependency-management.md` |
| LLM/AI | `llm-patterns.md` |

### Rules

- `rules/api-design.md` — REST conventions, status codes, pagination.
- `rules/git-workflow.md` — Branching, commits, releases.
- `rules/code-review.md` — Review checklist and severity levels.

## Verification

- `mvn spotless:check` passes (google-java-format)
- `mvn checkstyle:check` passes
- `mvn spotbugs:check` passes
- `mvn test` passes
- `mvn verify` passes with JaCoCo line coverage ≥ 80% and branch coverage ≥ 75%
- `mvn dependency-check:check` passes (no HIGH/CRITICAL CVEs)
