# Changelog

All notable changes to `nmn-java-skills-and-standards` are documented here.

---

## [1.0.0] — 2026-05-14 (initial release)

### Added — core
- Master agent contracts: `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md`
- `.cursor/rules/*.mdc` glob-based rules for modern Cursor
- `.kiro/steering/*.md` files for Kiro
- `.agents/skills/spring-boot-skill/SKILL.md` for Google Antigravity

### Added — skills/common
- `code-style.md` — google-java-format + Effective Java (Bloch) + NMN, with version matrix Java 11 → 17 → 21
- `code-style-index.md` — section map for targeted lookup
- `folder-structure.md` — single-module and multi-module Maven layouts, Flyway naming conventions
- `error-handling.md` — `AppException` hierarchy, `GlobalExceptionHandler`, `ApiErrorResponse`, typed exceptions, HTTP mapping
- `logging.md` — SLF4J + `@Slf4j` + Logback setup, MDC structured fields, `LogstashEncoder`, no-PII rules
- `security.md` — OWASP, `@ConfigurationProperties` secrets, `BCryptPasswordEncoder`/`Argon2`, `@Valid`, SQL injection prevention
- `api-auth.md` — JWT lifecycle, OAuth2, RBAC/ABAC, API keys, mTLS, service-to-service auth
- `testing.md` — JUnit 5, Mockito BDDMockito style, `@DataJpaTest`, `@WebMvcTest`, Testcontainers, JaCoCo coverage gates
- `db-design.md` — JPA entity design, indexing, Spring Data query patterns, `BigDecimal` money handling
- `data-migrations.md` — zero-downtime Flyway migrations, expand-contract patterns
- `performance.md` — `@Cacheable`, N+1 prevention, HikariCP tuning, `Pageable` pagination
- `concurrency-patterns.md` — `CompletableFuture`, `@Async`, virtual threads (Java 21), `MDC.clear()` discipline
- `llm-patterns.md` — prompt versioning, provider abstraction, conversation context, structured output
- `ci-cd.md` — GitHub Actions templates with Checkstyle, SpotBugs, OWASP Dependency Check, JaCoCo, Docker build
- `deployment.md` — multi-stage Docker with layered JAR, `eclipse-temurin:17-jre`, health probes, graceful shutdown, 12-factor
- `observability.md` — Micrometer + Spring Actuator + OpenTelemetry traces and metrics, MDC-OTel correlation
- `microservices.md` — boundaries, `RestClient` sync/async, Spring Cloud Contract, Resilience4j circuit breaker, Saga pattern
- `feature-flags.md` — flag types, rollout strategy, lifecycle, testing patterns
- `dependency-management.md` — `pom.xml` discipline, BOM imports, dependency scopes, OWASP check, Renovate config

### Added — framework skills
- `skills/spring-boot/SKILL.md` — primary Spring MVC skill with 11 hard rules and 10-step generation order
- `skills/spring-boot/assets/pom-template.xml` — base Maven POM with standard NMN dependencies
- `skills/spring-boot/assets/application-template.yml` — base `application.yml` with datasource, JPA, Flyway, JWT, Actuator config
- `skills/spring-webflux/SKILL.md` — reactive WebFlux + R2DBC skill
- `skills/kafka/SKILL.md` — Kafka producer/consumer skill
- `skills/grpc/SKILL.md` — gRPC service skill

### Added — rules / agents / docs
- `rules/api-design.md`, `rules/git-workflow.md`, `rules/code-review.md`
- `agents/qa-agent.md` — `/review` command, structured ❌/⚠️/💡 audit report
- `docs/onboarding.md`, `docs/ai-tool-compatibility.md`, `docs/incident-response.md`, `docs/tech-debt.md`
- `docs/adr/ADR-template.md`

### Added — example
- `examples/spring-boot-app/` — minimal reference implementation (layered package structure)

---

## How to update

When you change a skill or rule:

1. Add an entry under a new `[Unreleased]` heading describing what changed and why.
2. On release, rename `[Unreleased]` to the new version with today's date.
3. Tag the release: `git tag v{version}` and push the tag.
4. Notify the team Slack channel — other projects need to pull the update.
