# NMN Java Spring Boot AI-SDLC Framework — Complete Guide

**What this repo is, why it exists, and how to use it from scratch.**

---

## Table of Contents

1. [What Is This Repository?](#1-what-is-this-repository)
2. [The Problem It Solves](#2-the-problem-it-solves)
3. [How It Works — Architecture](#3-how-it-works--architecture)
4. [Repository Structure](#4-repository-structure)
5. [The Standards It Enforces](#5-the-standards-it-enforces)
6. [Getting Started From Scratch](#6-getting-started-from-scratch)
7. [Tool-by-Tool Setup](#7-tool-by-tool-setup)
8. [Day-to-Day Usage](#8-day-to-day-usage)
9. [The Reference Example App](#9-the-reference-example-app)
10. [Key Skill Files — What Each One Covers](#10-key-skill-files--what-each-one-covers)
11. [The 20 Non-Negotiable Rules](#11-the-20-non-negotiable-rules)
12. [How a Feature Gets Built — Step by Step](#12-how-a-feature-gets-built--step-by-step)
13. [Contributing and Keeping It Updated](#13-contributing-and-keeping-it-updated)
14. [FAQ](#14-faq)

---

## 1. What Is This Repository?

This repository is the **shared engineering brain** for all NMN Java Spring Boot projects.

It contains structured text files — called **skill files** — that AI coding agents (Claude Code, Cursor, Kiro, GitHub Copilot, etc.) read before writing any code. Those files encode every NMN Spring Boot convention: naming rules, layer discipline, security patterns, test structure, API shape, error handling, database migration strategy, and more.

**In one sentence:** drop this repo's files into any Java project and every AI agent that touches that project will write code that follows NMN standards — automatically, every time.

It is compatible with:
- Claude Code
- OpenAI Codex / Codex CLI
- Cursor (MDC rules + legacy `.cursorrules`)
- Kiro
- Windsurf
- Gemini CLI
- Google Antigravity
- GitHub Copilot

---

## 2. The Problem It Solves

### Without this repo

Every developer (and every AI agent) makes independent decisions:

| Decision | Developer A | Developer B | Agent without context |
|---|---|---|---|
| Injection style | `@Autowired` field | Constructor | Random |
| Return type | Raw `List<Order>` | `ResponseEntity<List<OrderResponse>>` | Random |
| Validation status code | 400 | 422 | 400 or 422, inconsistent |
| Error response shape | Custom wrapper | Flat body | No standard |
| Database tests | H2 in-memory | Testcontainers | Whatever is easiest |
| Money representation | `double` | `BigDecimal` | Random |
| Logging | `System.out.println` | `@Slf4j` + SLF4J | Random |
| Migrations | `ddl-auto=update` | Flyway | Varies |

The result is a codebase with no consistent style, full of subtle bugs (H2 tests passing while PostgreSQL queries fail in production, timing attacks from `.equals()` on secrets, N+1 queries, leaked entity fields in API responses).

### With this repo

Every agent reads the same rules before writing a single line. The result:

- Every service has a `Service` interface + `impl/` class — every time.
- Every controller returns `ResponseEntity<T>` with DTOs — never entities.
- Every validation failure returns 422 with a structured `VALIDATION_ERROR` body.
- Every integration test spins up a real PostgreSQL container — never H2.
- Every secret comparison uses `MessageDigest.isEqual()`.
- Every schema change goes through Flyway — never `ddl-auto=update` in production.

One update to a skill file propagates to every project and every AI tool simultaneously.

---

## 3. How It Works — Architecture

### Single Source of Truth

All canonical content lives in `skills/` and `rules/`. Every AI tool has its own thin "loader" file that points here:

```
skills/common/*.md           ← Canonical standards (code style, security, testing, etc.)
skills/{framework}/SKILL.md  ← Framework rules (spring-boot / spring-webflux / kafka / grpc)
rules/*.md                   ← Process rules (API design, git workflow, code review)
         │
         ├── CLAUDE.md                        → Claude Code reads this
         ├── AGENTS.md                        → Codex / Kiro / Antigravity read this
         ├── GEMINI.md                        → Gemini CLI reads this
         ├── .cursorrules                     → Cursor (legacy) reads this
         ├── .cursor/rules/*.mdc              → Cursor (modern) reads these
         ├── .windsurfrules                   → Windsurf reads this
         ├── .kiro/steering/*.md              → Kiro reads these
         ├── .github/copilot-instructions.md  → GitHub Copilot reads this
         └── .agents/skills/*/SKILL.md        → Google Antigravity reads this
```

**Key principle:** if you update `skills/common/security.md`, all tools get the update. No duplication. No drift.

### How an Agent Uses It

When you ask Claude Code to "add a product management API", it:

1. Reads `CLAUDE.md` (master contract, always auto-loaded).
2. Loads `skills/common/code-style.md` (mandatory for every task).
3. Loads `skills/spring-boot/SKILL.md` (the MVC skill).
4. Loads domain-specific skills (`db-design.md`, `security.md`, `testing.md`).
5. Follows the generation order: Entity → DTO → Repository → Mapper → Service → Controller → Tests.
6. Cites the rule it is applying when making each decision.

---

## 4. Repository Structure

```
nmn-java-skills-and-standards/
│
├── CLAUDE.md                         Master agent contract (Claude Code)
├── AGENTS.md                         Agent contract (Codex, Kiro, Antigravity)
├── GEMINI.md                         Gemini CLI agent contract
├── .cursorrules                      Cursor legacy rules (auto-loaded)
├── .windsurfrules                    Windsurf rules
├── .gitignore                        Ignores .idea/, target/, .env, *.jar, etc.
├── .env.example                      Template for local environment variables
├── .pre-commit-config.yaml           Pre-commit hooks (google-java-format, gitleaks, etc.)
│
├── .cursor/rules/                    Modern Cursor MDC rules
│   ├── java-core.mdc                 Core Java rules (always active)
│   ├── java-security.mdc             Security rules (always active)
│   ├── java-spring-boot.mdc          Spring Boot rules (auto-attach to controller/service)
│   └── java-testing.mdc              Testing rules (auto-attach to test files)
│
├── .kiro/steering/                   Kiro steering files (auto-loaded)
│   ├── product.md                    Product context
│   ├── tech.md                       Technology stack
│   └── structure.md                  Project structure
│
├── .github/
│   └── copilot-instructions.md       GitHub Copilot instructions
│
├── .agents/skills/spring-boot-skill/ Google Antigravity entry point
│
├── skills/
│   ├── common/                       Language-level skills (apply to all Spring Boot)
│   │   ├── code-style.md             Google Java Format, Effective Java, naming rules
│   │   ├── code-style-index.md       Quick section map for code-style.md
│   │   ├── folder-structure.md       Package layout, multi-module Maven
│   │   ├── error-handling.md         AppException hierarchy, GlobalExceptionHandler
│   │   ├── logging.md                SLF4J, Logback, MDC, LogstashEncoder
│   │   ├── security.md               OWASP, Spring Security, input validation, CSRF
│   │   ├── api-auth.md               OAuth2, JWT (jjwt), RBAC/ABAC, service-to-service
│   │   ├── testing.md                JUnit 5, Mockito, Testcontainers, @WebMvcTest
│   │   ├── db-design.md              JPA entity design, indexes, query patterns
│   │   ├── data-migrations.md        Zero-downtime Flyway migrations
│   │   ├── performance.md            Caching, N+1 prevention, HikariCP tuning
│   │   ├── concurrency-patterns.md   CompletableFuture, @Async, virtual threads
│   │   ├── llm-patterns.md           LLM client abstraction, prompt management
│   │   ├── ci-cd.md                  GitHub Actions, JaCoCo, OWASP Dependency Check
│   │   ├── deployment.md             Docker distroless, health checks, 12-factor app
│   │   ├── observability.md          Micrometer, Actuator, OpenTelemetry, tracing
│   │   ├── microservices.md          Service boundaries, RestClient, Resilience4j
│   │   ├── feature-flags.md          OpenFeature, flag lifecycle, gradual rollouts
│   │   └── dependency-management.md  pom.xml discipline, BOM imports, Renovate
│   │
│   ├── spring-boot/
│   │   ├── SKILL.md                  Primary MVC skill — load for every MVC project
│   │   └── assets/
│   │       ├── pom-template.xml      Base Maven POM with all standard dependencies
│   │       ├── application-template.yml  Base application.yml
│   │       ├── checkstyle.xml        NMN Checkstyle configuration
│   │       ├── logback-spring.xml    JSON logging (prod) + color console (local)
│   │       └── owasp-suppressions.xml    Template for OWASP false-positive suppressions
│   │
│   ├── spring-webflux/
│   │   └── SKILL.md                  Reactive / WebFlux skill
│   │
│   ├── kafka/
│   │   └── SKILL.md                  Kafka producer/consumer skill
│   │
│   └── grpc/
│       └── SKILL.md                  gRPC service skill
│
├── rules/
│   ├── api-design.md                 REST URL structure, status codes, pagination shape
│   ├── git-workflow.md               Branching, Conventional Commits, releases
│   └── code-review.md                Review checklist, severity levels, feedback patterns
│
├── agents/
│   └── qa-agent.md                   /review command — structured audit report
│
├── docs/
│   ├── onboarding.md                 New developer quick-start
│   ├── ai-tool-compatibility.md      Per-tool architecture and setup details
│   ├── incident-response.md          On-call runbook, severity, escalation, postmortems
│   ├── tech-debt.md                  Debt taxonomy, prioritization, scheduling
│   └── adr/
│       ├── ADR-template.md           Architecture Decision Record template
│       ├── ADR-001-jjwt-over-auth0.md       Why jjwt, not auth0/java-jwt
│       ├── ADR-002-flyway-over-liquibase.md Why Flyway, not Liquibase
│       └── ADR-003-testcontainers-over-h2.md Why Testcontainers, not H2
│
└── examples/
    └── spring-boot-app/              Complete reference Spring Boot application
        ├── pom.xml                   Production-ready Maven POM
        ├── src/main/java/...         Entity, DTOs, Repository, Mapper, Service, Controller
        ├── src/main/resources/       application.yml + Flyway migration
        └── src/test/java/...         Unit tests, @WebMvcTest slice, @DataJpaTest integration
```

---

## 5. The Standards It Enforces

### Technology Choices (locked in)

| Concern | Standard | Why |
|---|---|---|
| Build | Maven 3.9+ | Industry standard; reproducible builds |
| Framework | Spring Boot 3.4.x | LTS path; auto-configuration |
| Language | Java 17 minimum | LTS; records, sealed classes, text blocks |
| Database | PostgreSQL | Production-grade; dialect enforced in tests |
| Migrations | Flyway | SQL-native; DBA-readable; proven zero-downtime patterns |
| JWT | `io.jsonwebtoken:jjwt` 0.12.x | Actively maintained; type-safe API; see ADR-001 |
| Logging | SLF4J + Logback + `LogstashEncoder` | Structured JSON in prod; MDC for trace correlation |
| Testing DB | Testcontainers (real PostgreSQL) | H2 dialect mismatch caused production incidents; see ADR-003 |
| Docker | Distroless (`gcr.io/distroless/java17-debian12:nonroot`) | Minimal attack surface; no shell in prod |
| HTTP client | `RestClient` (Spring Boot 3.2+) | `RestTemplate` is deprecated |
| Mapping | MapStruct | Compile-time; zero reflection overhead |
| Code format | `google-java-format` — 2-space indent | Enforced by Spotless Maven plugin |

### API Contract Rules

- URL: `GET /api/v1/{resource}` — versioned, plural nouns, kebab-case
- Success: flat DTO (no envelope wrapper)
- Validation failure: **422 Unprocessable Entity** + `VALIDATION_ERROR` body
- Not found: **404** + `RESOURCE_NOT_FOUND` body
- Auth failure: **401** (missing/invalid token), **403** (authenticated but forbidden)
- Error body always includes: `status`, `errorCode`, `message`, `timestamp`, `requestId`

### Layer Rules

```
Controller  → receives HTTP, delegates to service, returns ResponseEntity<DTO>
Service     → business logic, owns @Transactional, throws typed AppException subclasses
Repository  → data access only, no business logic
Model       → JPA entity only, zero business logic
```

No layer may reach past its neighbour. Controllers never touch repositories. Entities never leave the service layer.

---

## 6. Getting Started From Scratch

### Step 1 — Clone this repository

```bash
git clone https://github.com/nmn/java-ai-sdlc-standards.git
```

### Step 2 — Copy the skill files into your project

```bash
cd your-java-project

# Copy all skill files, rules, and agent configs
cp -r /path/to/standards/skills ./skills
cp -r /path/to/standards/rules  ./rules
cp -r /path/to/standards/agents ./agents
cp -r /path/to/standards/docs   ./docs

# Copy the AI tool config files
cp /path/to/standards/CLAUDE.md        ./CLAUDE.md
cp /path/to/standards/AGENTS.md        ./AGENTS.md
cp /path/to/standards/GEMINI.md        ./GEMINI.md
cp /path/to/standards/.cursorrules     ./.cursorrules
cp -r /path/to/standards/.cursor       ./.cursor
cp /path/to/standards/.windsurfrules   ./.windsurfrules
cp -r /path/to/standards/.kiro         ./.kiro
cp -r /path/to/standards/.agents       ./.agents
cp -r /path/to/standards/.github       ./.github

# Copy starter assets
cp /path/to/standards/skills/spring-boot/assets/pom-template.xml      ./pom.xml
cp /path/to/standards/skills/spring-boot/assets/application-template.yml \
   src/main/resources/application.yml
cp /path/to/standards/skills/spring-boot/assets/checkstyle.xml        ./checkstyle.xml
cp /path/to/standards/skills/spring-boot/assets/logback-spring.xml    \
   src/main/resources/logback-spring.xml
cp /path/to/standards/.env.example                                     ./.env.example
cp /path/to/standards/.pre-commit-config.yaml                          ./.pre-commit-config.yaml
```

### Step 3 — Install pre-commit hooks

```bash
pip install pre-commit
pre-commit install
```

This enforces `google-java-format`, YAML validation, trailing whitespace, and secret detection (gitleaks) before every commit.

### Step 4 — Set up your local environment

```bash
cp .env.example .env
# Edit .env — fill in DB_PASSWORD, JWT_SECRET, etc.
```

Never commit `.env` — it is in `.gitignore`.

### Step 5 — Tell the agent your project details

Add these lines to the top of your project's `CLAUDE.md`:

```
This project uses Spring Boot 3.4.x with PostgreSQL on Java 17.
Maven is the build tool.
Load skills/spring-boot/SKILL.md as the primary framework skill.
```

Adjust for your Java version, database, or framework variant (WebFlux, Kafka, gRPC).

### Step 6 — Start the agent

```bash
# Claude Code
claude code
```

Then type your first request: `"Create a product management API with CRUD endpoints"`. The agent will:

1. Read `CLAUDE.md` and the referenced skill files.
2. Generate files in the standard order: Entity → DTO → Repository → Mapper → Service → Controller → Tests.
3. Follow every rule — 422 for validation, DTOs at the boundary, Flyway migration, Testcontainers test.

---

## 7. Tool-by-Tool Setup

### Claude Code

`CLAUDE.md` is auto-loaded at the project root before every task. No setup needed beyond Step 2 above.

**Useful slash commands:**

| Command | What it does |
|---|---|
| `/load-skill spring-boot` | Loads all common + spring-boot skills into context |
| `/new-endpoint POST /api/v1/products "Create a product"` | Scaffolds controller method + service + tests |
| `/review ProductController.java` | Standards audit — returns ✅ / ⚠️ / ❌ per rule |
| `/add-tests ProductServiceImpl.java` | Generates missing unit + integration tests |
| `/migrate "add orders table"` | Creates Flyway migration V{n}__add_orders_table.sql |

### Cursor

`.cursorrules` is auto-loaded for all files. For Cursor ≥ 0.45, `.cursor/rules/*.mdc` files attach automatically based on file globs:

| MDC file | Applies to |
|---|---|
| `java-core.mdc` | All `*.java` files (always) |
| `java-security.mdc` | All `*.java` files (always) |
| `java-spring-boot.mdc` | `controller/**`, `service/**` (auto-attach) |
| `java-testing.mdc` | `src/test/**/*.java` (auto-attach) |

No manual setup needed — open the project in Cursor and all rules are active.

### Kiro

Kiro reads `.kiro/steering/*.md` automatically in every session:

- `tech.md` — technology stack and library choices
- `product.md` — product context
- `structure.md` — project layout

It also reads `AGENTS.md`. No setup needed.

### GitHub Copilot

`.github/copilot-instructions.md` is loaded automatically when you open the project. All rules apply to inline completions and chat.

### Windsurf

`.windsurfrules` is auto-loaded. No setup needed.

### Gemini CLI

`GEMINI.md` is auto-loaded. No setup needed.

### Google Antigravity

`.agents/skills/spring-boot-skill/SKILL.md` is the entry point. The `AGENTS.md` file is also loaded.

---

## 8. Day-to-Day Usage

### Starting a new feature

Ask the agent in plain English:

```
"Add a customer management module — customers have name, email, phone, and active flag.
Need full CRUD with search by name and pagination. Email must be unique."
```

The agent will:
1. Confirm the Java version and DB engine.
2. Create files in order: `Customer.java` → `CreateCustomerRequest.java` → `CustomerResponse.java` → `CustomerRepository.java` → `CustomerMapper.java` → `CustomerService.java` → `CustomerServiceImpl.java` → `CustomerController.java` → `V{n}__create_customers.sql`.
3. Cite the rule being applied at each decision point.

### Running a code review audit

```
/review src/main/java/com/nmn/myservice/service/impl/OrderServiceImpl.java
```

Returns a structured report with ✅ (pass), ⚠️ (warning), ❌ (blocker) against every rule in `rules/code-review.md`.

### Adding tests to existing code

```
/add-tests OrderServiceImpl.java
```

Generates:
- `OrderServiceTest.java` — unit tests with `@ExtendWith(MockitoExtension.class)`, BDDMockito, AssertJ
- `OrderControllerTest.java` — `@WebMvcTest` slice with `@MockBean` service
- `OrderRepositoryIT.java` — `@DataJpaTest` + Testcontainers PostgreSQL

### Creating a Flyway migration

```
/migrate "add index on orders(customer_id, status)"
```

Creates `V{n}__add_index_orders_customer_id_status.sql` with the correct DDL and the zero-downtime expand-contract pattern if destructive.

### Checking for OWASP vulnerabilities

```bash
mvn dependency-check:check
```

CI blocks on CVSS ≥ 7.0. Suppress false positives in `skills/spring-boot/assets/owasp-suppressions.xml` — every suppression requires a `<notes>` field with justification and expiry date.

---

## 9. The Reference Example App

`examples/spring-boot-app/` is a complete, working Spring Boot application that demonstrates every standard in practice. Use it as a reference when building real features.

### What it contains

| File | Demonstrates |
|---|---|
| `model/Product.java` | JPA entity: `@Getter`/`@Setter` (not `@Data`), audit fields, `@Version`, `@Column` constraints |
| `dto/request/CreateProductRequest.java` | Inbound DTO: Java record + `@Valid` annotations |
| `dto/request/UpdateProductRequest.java` | Update DTO: all fields required, explicit validation |
| `dto/response/ProductResponse.java` | Outbound DTO: immutable Java record, no entity fields |
| `exception/AppException.java` | Base exception carrying `HttpStatus` + `errorCode` |
| `exception/ResourceNotFoundException.java` | 404 — standard "not found" exception |
| `exception/ValidationException.java` | 422 — standard validation exception |
| `exception/GlobalExceptionHandler.java` | `@RestControllerAdvice` mapping all exceptions to HTTP |
| `repository/ProductRepository.java` | `JpaRepository` + JPQL named-parameter search query |
| `mapper/ProductMapper.java` | MapStruct interface — `toEntity()`, `toResponse()`, `updateEntity()` |
| `service/ProductService.java` | Interface with Javadoc on every method |
| `service/impl/ProductServiceImpl.java` | `@Service` impl — `@Transactional`, `@Slf4j`, typed exceptions |
| `controller/ProductController.java` | `@RestController` — `ResponseEntity<T>`, `@Valid`, `@PreAuthorize`, OpenAPI annotations |
| `resources/application.yml` | Complete config: HikariCP, Flyway, open-in-view=false, shutdown=graceful |
| `resources/db/migration/V1__create_products.sql` | Flyway DDL: proper types, CHECK constraint, partial index |
| `service/ProductServiceTest.java` | Unit test: `@ExtendWith(MockitoExtension.class)`, BDDMockito, AssertJ, `@Nested` |
| `controller/ProductControllerTest.java` | `@WebMvcTest`: 200/201/404/422/403 cases, `@WithMockUser`, `jsonPath` assertions |
| `repository/ProductRepositoryIT.java` | `@DataJpaTest` + Testcontainers PostgreSQL — real dialect, real constraints |

### Running it

```bash
cd examples/spring-boot-app
docker compose up -d postgres    # or use the Testcontainers IT tests directly
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

---

## 10. Key Skill Files — What Each One Covers

| File | Load when you are... | Key content |
|---|---|---|
| `skills/common/code-style.md` | Writing any Java | Google Java Format, naming rules, Lombok rules, `@Transactional` pitfalls, `BigDecimal`, `Optional` |
| `skills/common/error-handling.md` | Adding error handling | Full `AppException` hierarchy, `GlobalExceptionHandler` template, HTTP status mapping table |
| `skills/common/security.md` | Any auth / input validation work | OWASP Top 10, Spring Security filter chain, `SecureRandom`, `MessageDigest.isEqual()`, rate limiting |
| `skills/common/api-auth.md` | JWT / OAuth2 / RBAC | JWT config with jjwt 0.12.x, `JwtAuthFilter`, `SecurityFilterChain`, RBAC/ABAC with `@PreAuthorize` |
| `skills/common/testing.md` | Writing tests | JUnit 5, BDDMockito, AssertJ, Testcontainers, `@WebMvcTest`, `@DataJpaTest`, Awaitility, ArchUnit |
| `skills/common/db-design.md` | Creating entities or queries | JPA entity patterns, N+1 prevention, `@EntityGraph`, index design, pagination |
| `skills/common/data-migrations.md` | Schema changes | Flyway naming, expand-contract zero-downtime pattern, backfill migrations, rollback strategy |
| `skills/common/performance.md` | Performance-sensitive code | `@Cacheable` with Caffeine/Redis, N+1 prevention, HikariCP tuning, `RestClient` timeouts |
| `skills/common/logging.md` | Adding logging | `@Slf4j`, MDC (requestId/traceId/userId), `LogstashEncoder` for JSON, no-PII rules |
| `skills/common/deployment.md` | Docker / CI | Distroless multi-stage Dockerfile, graceful shutdown, health probes, 12-factor compliance |
| `skills/common/observability.md` | Tracing / metrics | Micrometer, OpenTelemetry auto-instrumentation, custom metrics, Actuator endpoints |
| `skills/common/concurrency-patterns.md` | Async / scheduled tasks | `CompletableFuture`, `@Async` + `ThreadPoolTaskExecutor`, virtual threads, `@Scheduled` |
| `skills/kafka/SKILL.md` | Kafka producers/consumers | `@KafkaListener`, `@RetryableTopic`, DLT with `@DltHandler`, outbox pattern |
| `skills/grpc/SKILL.md` | gRPC services | `grpc-spring-boot-starter`, `@GrpcService`, `@GrpcClient`, `buf` lint, protobuf conventions |
| `rules/api-design.md` | Designing REST endpoints | URL structure, HTTP method semantics, status code table, pagination shape |
| `rules/git-workflow.md` | Git / PRs | Conventional Commits, branch naming, squash merge, semantic versioning |
| `rules/code-review.md` | Reviewing code | Full checklist by category, severity levels (BLOCKER/MUST FIX/SUGGESTION/NIT), feedback templates |

---

## 11. The 20 Non-Negotiable Rules

These are enforced in every generated file, every code review, and every CI pipeline run. No exceptions.

| # | Rule | Where enforced |
|---|---|---|
| 1 | Check `<java.version>` in `pom.xml` before using version-specific syntax | Every task |
| 2 | `google-java-format` clean — 2-space indent, never tabs | Spotless + pre-commit hook |
| 3 | All public service interface methods must have Javadoc starting with an imperative verb | Checkstyle |
| 4 | Throw typed `AppException` subclasses — never swallow silently | Code review |
| 5 | No hardcoded secrets — all config via env vars into `@ConfigurationProperties` typed records | SpotBugs + code review |
| 6 | `@Slf4j` + SLF4J `{}` placeholders — never `System.out.println` | Checkstyle Regexp check |
| 7 | Spring Data derived queries or JPQL named parameters — never string-concatenated SQL | SpotBugs find-sec-bugs |
| 8 | Tests mandatory — 80% instruction coverage minimum (JaCoCo) | JaCoCo CI gate |
| 9 | All endpoints authenticated unless explicitly marked `.permitAll()` | Code review |
| 10 | Layer discipline: Controller → Service → Repository → Model | ArchUnit test |
| 11 | Constructor injection only — never `@Autowired` on fields | Checkstyle + code review |
| 12 | DTOs at every API boundary — entities never returned from controllers | Code review (BLOCKER) |
| 13 | `ResponseEntity<T>` return type on all controller methods | Code review |
| 14 | `@Valid` on every `@RequestBody` parameter | Code review |
| 15 | Monetary values: `new BigDecimal("19.99")` from String — never `new BigDecimal(19.99)` | Code review (BLOCKER) |
| 16 | Service interface + `impl/` implementation — always separate | Code review |
| 17 | Flyway for all schema changes — never `ddl-auto=update` in non-local environments | CI config check |
| 18 | `@Transactional` on public methods only | Code review |
| 19 | `SecureRandom` for security-relevant randomness — never `java.util.Random` | SpotBugs + code review |
| 20 | `MessageDigest.isEqual()` for secret comparisons — never `.equals()` | SpotBugs find-sec-bugs |

---

## 12. How a Feature Gets Built — Step by Step

Here is exactly what happens when you ask the agent: *"Add a customer management API"*.

### Files generated in this order

```
1. model/Customer.java
   ├── @Entity, @Table(name = "customers")
   ├── @Id + @GeneratedValue(strategy = IDENTITY)
   ├── @Column(nullable = false, ...) on every field
   ├── @CreationTimestamp / @UpdateTimestamp
   ├── @Version for optimistic locking
   └── @Getter / @Setter (never @Data on entities)

2. dto/request/CreateCustomerRequest.java
   ├── Java record
   ├── @NotBlank, @Email, @Size, @Pattern per field
   └── JSR-303 / Bean Validation annotations only

3. dto/response/CustomerResponse.java
   └── Immutable Java record — no entity references, no sensitive fields

4. repository/CustomerRepository.java
   ├── extends JpaRepository<Customer, Long>
   └── JPQL named-parameter search (@Query with :name, :email params)

5. mapper/CustomerMapper.java
   ├── @Mapper(componentModel = "spring")
   ├── Customer toEntity(CreateCustomerRequest)
   ├── CustomerResponse toResponse(Customer)
   └── void updateEntity(UpdateCustomerRequest, @MappingTarget Customer)

6. service/CustomerService.java
   └── Interface — Javadoc on every method starting with an imperative verb

7. service/impl/CustomerServiceImpl.java
   ├── @Service, @RequiredArgsConstructor, @Slf4j
   ├── @Transactional on mutating methods
   ├── @Transactional(readOnly = true) on reads
   └── Throws ResourceNotFoundException / ValidationException

8. controller/CustomerController.java
   ├── @RestController, @RequestMapping("/api/v1/customers")
   ├── ResponseEntity<T> on every method
   ├── @Valid on every @RequestBody
   ├── @PreAuthorize on protected operations
   ├── POST returns 201 + Location header
   └── DELETE returns 204

9. db/migration/V{n}__create_customers.sql
   ├── CREATE TABLE with proper PostgreSQL types
   ├── CHECK constraints
   └── Indexes for query patterns

10. Tests
    ├── CustomerServiceTest.java    — @ExtendWith(MockitoExtension.class)
    ├── CustomerControllerTest.java — @WebMvcTest + @WithMockUser
    └── CustomerRepositoryIT.java   — @DataJpaTest + Testcontainers PostgreSQL
```

### What the generated controller looks like

```java
@Tag(name = "Customers")
@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerController {

  private final CustomerService customerService;

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<CustomerResponse> create(@Valid @RequestBody CreateCustomerRequest request) {
    CustomerResponse created = customerService.create(request);
    URI location = ServletUriComponentsBuilder.fromCurrentRequest()
        .path("/{id}").buildAndExpand(created.id()).toUri();
    return ResponseEntity.created(location).body(created);
  }

  @GetMapping("/{id}")
  public ResponseEntity<CustomerResponse> getById(@PathVariable Long id) {
    return ResponseEntity.ok(customerService.getById(id));
  }
}
```

Every decision here — `ResponseEntity<T>`, `@Valid`, `@PreAuthorize`, `201` + `Location`, `@RequiredArgsConstructor` — is mandated by a specific rule in the skill files.

---

## 13. Contributing and Keeping It Updated

### When to update a skill file

- You discover a new best practice (e.g., a better Resilience4j pattern).
- A library has a breaking change that affects the standard patterns.
- A production incident reveals a gap (e.g., a new SQL injection vector, a missing test pattern).
- The team agrees to change a convention (e.g., changing the pagination shape).

### Process

1. Update the relevant skill file with the new/changed pattern.
2. Open a PR with a clear description: what changed, why, and which projects are affected.
3. Tag the PR `skills-update`.
4. Post to the team Slack — every project using these skills needs to pull the update.
5. Update the `CHANGELOG.md` with the change.
6. If an ADR is needed (library choice, architectural decision), add one to `docs/adr/` using the template.

### Sprint cadence

During each sprint retrospective, spend 10 minutes reviewing:
- Did we run into a pattern not covered by the skills?
- Did any generated code fail code review repeatedly (same rule)? Update the skill.
- Are any dependency versions stale? Update `pom-template.xml`.

### Adding a new skill

1. Create `skills/common/{topic}.md` or `skills/{framework}/SKILL.md`.
2. Add a reference to it in `CLAUDE.md` file structure section.
3. Add a row to the "Load when" table in `README.md` and this guide.
4. Add load instructions to `AGENTS.md`, `GEMINI.md`, and `.cursorrules`.

---

## 14. FAQ

**Q: Do I need all the skill files for every project?**

No. You copy the full skills directory but only the relevant files are loaded. A simple MVC REST API project only needs: `code-style.md`, `spring-boot/SKILL.md`, `error-handling.md`, `testing.md`, `db-design.md`. The agent knows which files to load based on the task.

**Q: What if my project uses a different tech stack (not PostgreSQL, not Flyway)?**

Override the relevant sections in your project's `CLAUDE.md`. For example: `"This project uses MySQL. Use `flyway-database-mysql` instead of postgresql. See skills/common/data-migrations.md for the migration pattern."` The skills are guidelines with explicit override points.

**Q: What if two skill files give conflicting advice?**

`rules/api-design.md` is authoritative on API shape and status codes. `skills/spring-boot/SKILL.md` is authoritative on code generation patterns. `skills/common/security.md` is authoritative on security decisions. In practice, they don't conflict — they cover different domains.

**Q: Can I use this without an AI agent — just as a coding standard?**

Yes. The skill files are human-readable documentation. `rules/code-review.md` is used by human reviewers in every PR regardless of whether an AI wrote the code. New engineers read `docs/onboarding.md` to get up to speed.

**Q: How do I know the agent actually followed the rules?**

Run `/review {filename}` after generation. The QA agent (`agents/qa-agent.md`) runs through every applicable rule and reports violations. In CI, JaCoCo, Checkstyle, SpotBugs, and PMD enforce the mechanical rules automatically.

**Q: Why is the standard JWT library jjwt and not auth0/java-jwt?**

See `docs/adr/ADR-001-jjwt-over-auth0.md` for the full decision. Short answer: jjwt is actively maintained with a cleaner Spring Boot 3.x integration, type-safe API, and no dependency on the auth0 ecosystem.

**Q: Why is H2 in-memory banned for tests?**

See `docs/adr/ADR-003-testcontainers-over-h2.md`. Two production incidents in Q4 2023 where H2 tests passed but PostgreSQL-specific syntax (`ON CONFLICT`, partial indexes, `JSONB`, `ILIKE`) caused deployment failures. Real containers start in under 10 seconds on CI.

**Q: What is the difference between 400 and 422?**

`400 Bad Request` — the request body is unparseable (malformed JSON, wrong content type). `422 Unprocessable Entity` — the body parsed correctly but failed `@Valid` Bean Validation (missing required field, email format invalid, price out of range). The distinction matters for clients — 400 means fix the request format; 422 means fix the field values.
