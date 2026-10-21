# Java Spring Boot AI-SDLC Framework — Master Context

> **Universal skills, rules and standards for AI-assisted Java Spring Boot development.**
> Compatible with: Claude Code · Cursor · Kiro · Windsurf · Gemini Code Assist · GitHub Copilot · Amazon Q
> Target experience level: Senior Java Spring Boot engineer following NMN standards.

---

## AGENT CONTRACT — READ BEFORE EVERY CODING TASK

1. Read this file entirely before writing any code.
2. Check `<java.version>` in `pom.xml` before using version-specific syntax (records, sealed classes, virtual threads, pattern matching, etc.).
3. Load `skills/common/code-style.md` for every task — no exceptions.
4. Load the framework-specific `skills/spring-boot/SKILL.md` (MVC) or `skills/spring-webflux/SKILL.md` (reactive).
5. Load domain-specific skills (`skills/common/security.md`, `db-design.md`, etc.) when relevant.
6. Cite the rule you are enforcing when you make a style or architectural decision.
7. Ask before assuming framework variant (MVC vs WebFlux), DB engine, auth mechanism, or Java version.
8. Never delete existing Flyway migrations, test files, or `.env.example` entries.
9. When in doubt between two approaches, choose the one that is more explicit and testable.

---

## NON-NEGOTIABLE RULES (always active — no exceptions)

| # | Rule | Source |
|---|---|---|
| 1 | Check `<java.version>` in `pom.xml` before using version-specific syntax | code-style.md §14 |
| 2 | `google-java-format` clean — 2-space indent, never tabs | code-style.md §2.1 |
| 3 | All public service interface methods must have Javadoc starting with an imperative verb | code-style.md §8.2 |
| 4 | Throw typed `AppException` subclasses — never `panic`, never swallow silently | error-handling.md §1 |
| 5 | No hardcoded secrets — all config via env vars into `@ConfigurationProperties` typed records | security.md §1 |
| 6 | `@Slf4j` + SLF4J `{}` placeholders — never `System.out.println` or `java.util.logging` | logging.md |
| 7 | Spring Data derived queries or JPQL named parameters — never string-concatenated SQL | db-design.md §4 |
| 8 | Tests mandatory for all business logic — 80% instruction coverage minimum (JaCoCo) | testing.md |
| 9 | All endpoints authenticated unless explicitly marked `.permitAll()` in `SecurityFilterChain` | security.md §2 |
| 10 | Layer discipline enforced — Controller → Service → Repository → Model | folder-structure.md |
| 11 | Constructor injection only — never `@Autowired` on fields | code-style.md §10.2 |
| 12 | DTOs at every API boundary — entities must never be returned from controllers | skills/spring-boot/SKILL.md |
| 13 | `ResponseEntity<T>` return type on all controller methods — no raw types | skills/spring-boot/SKILL.md |
| 14 | `@Valid` on every `@RequestBody` parameter — without exception | api-auth.md §3.1 |
| 15 | Monetary values: `new BigDecimal("19.99")` from String — never `new BigDecimal(19.99)` | code-style.md §13.8 |
| 16 | Service interface + `impl/` implementation — always separate | skills/spring-boot/SKILL.md |
| 17 | Flyway for all schema changes — never `ddl-auto=update` in non-local environments | data-migrations.md |
| 18 | `@Transactional` on public methods only — private methods silently ignored by Spring AOP | code-style.md §13.4 |
| 19 | `SecureRandom` for security-relevant randomness — never `java.util.Random` | security.md §10 |
| 20 | `MessageDigest.isEqual()` for secret comparisons — never `.equals()` (timing attack) | security.md §10 |

---

## FILE STRUCTURE

```
CLAUDE.md                              ← you are here (master context)
AGENTS.md                              ← OpenAI Codex · Kiro · Google Antigravity
GEMINI.md                              ← Gemini CLI
.cursorrules                           ← Cursor / older Kiro / Windsurf auto-load
.windsurfrules                         ← Windsurf Cascade
.github/copilot-instructions.md        ← GitHub Copilot
.agents/skills/spring-boot-skill/      ← Google Antigravity entry point
skills/
  common/
    code-style.md                      ← google-java-format + Effective Java + NMN
    code-style-index.md                ← Section map for targeted lookup
    folder-structure.md                ← Package layout + multi-module Maven
    error-handling.md                  ← AppException hierarchy, GlobalExceptionHandler
    logging.md                         ← SLF4J + Logback + MDC + LogstashEncoder
    security.md                        ← OWASP + Spring Security + input validation
    api-auth.md                        ← OAuth2, JWT, RBAC/ABAC, service-to-service
    testing.md                         ← JUnit 5, Mockito, @DataJpaTest, Testcontainers
    db-design.md                       ← JPA entity design, indexing, query patterns
    data-migrations.md                 ← Zero-downtime Flyway migrations
    performance.md                     ← Caching, N+1 prevention, HikariCP tuning
    concurrency-patterns.md            ← CompletableFuture, @Async, virtual threads
    llm-patterns.md                    ← Prompt management, LLM client abstraction
    ci-cd.md                           ← GitHub Actions, JaCoCo, OWASP Dependency Check
    deployment.md                      ← Docker layered JAR, health checks, 12-factor
    observability.md                   ← Micrometer, Actuator, OpenTelemetry, tracing
    microservices.md                   ← Service boundaries, RestClient, Resilience4j
    feature-flags.md                   ← Gradual rollouts, flag lifecycle, cleanup
    dependency-management.md           ← pom.xml, BOM, OWASP check, Renovate
  spring-boot/
    SKILL.md                           ← Primary Spring MVC skill
    assets/
      pom-template.xml                 ← Base Maven POM with standard dependencies
      application-template.yml         ← Base application.yml
  spring-webflux/SKILL.md              ← Reactive / WebFlux skill
  kafka/SKILL.md                       ← Kafka producer/consumer skill
  grpc/SKILL.md                        ← gRPC service skill
rules/
  api-design.md                        ← REST conventions, status codes, pagination
  git-workflow.md                      ← Branching, Conventional Commits, releases
  code-review.md                       ← ❌/⚠️/💡 checklist, severity, feedback
agents/
  qa-agent.md                          ← /review command, structured audit report
docs/
  onboarding.md
  ai-tool-compatibility.md
  incident-response.md                 ← Severity, escalation, postmortems
  tech-debt.md                         ← Tracking, prioritization, scheduling
  adr/
    ADR-template.md                    ← Architecture decision record template
examples/
  spring-boot-app/                     ← Reference implementation
```

---

## HOW TO PRIME AN AGENT FOR A PROJECT

Add to your project's `CLAUDE.md` or first message:

```
This project uses Spring Boot 3.x with PostgreSQL on Java 17.
java 17 in pom.xml.
Load skills/spring-boot/SKILL.md as the primary framework skill.
```

Or in Claude Code:
```
/load-skill spring-boot
```

---

## GENERATION ORDER (follow for every new feature)

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

---
