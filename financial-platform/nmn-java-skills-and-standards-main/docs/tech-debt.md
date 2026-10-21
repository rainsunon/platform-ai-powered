# Technical Debt Management

**Applies to:** All engineering teams.
**Owner:** Tech leads, reviewed during sprint planning.

---

## SECTION 1 — WHAT COUNTS AS TECH DEBT

| Category | Examples |
|----------|---------|
| **Code debt** | Duplicated logic, god classes, missing abstractions, no tests, swallowed exceptions, `@Autowired` field injection throughout |
| **Architecture debt** | Monolith that should be split, wrong DB choice, missing caching layer, entities exposed at API boundary |
| **Dependency debt** | Outdated Maven dependencies, deprecated Spring APIs, unsupported Java LTS version, CVEs in OWASP report |
| **Infrastructure debt** | Manual deployments, no monitoring, missing IaC, no health probes configured |
| **Documentation debt** | Missing ADRs, outdated README, no runbooks, skill files not reflecting current standards |
| **Test debt** | Low JaCoCo coverage, flaky tests, missing `@DataJpaTest` + Testcontainers tests, H2 in-memory replacing real Postgres |

### What is NOT tech debt

- Intentional simplicity (YAGNI) — choosing not to build something you don't need yet.
- Learning — code by juniors that works correctly but isn't elegant.
- Feature requests disguised as debt — "we should rewrite this in Kotlin".

---

## SECTION 2 — TRACKING

### Ticket Format

```
Title: [DEBT] Short description of the problem
Labels: tech-debt, severity/{critical|high|medium|low}

## Problem
What's wrong and where (class names, package paths, service names).

## Impact
- Developer productivity: how much time is wasted per week?
- Risk: what could go wrong if we don't fix this?
- Scope: how many classes / services are affected?

## Proposed Solution
Brief description of the fix approach.

## Effort Estimate
T-shirt size: S (< 1 day) | M (1-3 days) | L (3-5 days) | XL (> 1 week)
```

### Debt Registry (example)

| Item | Category | Severity | Effort | Impact | Score |
|------|----------|----------|--------|--------|-------|
| No tests on payment service | Test | Critical | L | High (regression risk) | 9 |
| Java 17 → Java 21 upgrade | Dependency | High | M | Medium (virtual threads, perf) | 7 |
| `@Autowired` field injection across 4 services | Code | High | M | Medium (untestable, fragile) | 7 |
| Manual deployment scripts, no Dockerfile | Infra | High | L | High (error-prone, slow) | 8 |
| Entities returned from controllers in legacy modules | Architecture | Critical | L | High (security + coupling) | 9 |
| H2 in-memory DB in integration tests | Test | Medium | M | Medium (false test confidence) | 6 |
| Spring Boot 2.x → 3.x upgrade | Dependency | High | XL | High (Jakarta EE, security patches) | 8 |

---

## SECTION 3 — PRIORITISATION FRAMEWORK

### Scoring (1–10)

```
Score = (Impact × 2 + Risk × 2 + Frequency) / 5
```

| Factor | 1 (low) | 5 (medium) | 10 (high) |
|--------|---------|------------|-----------|
| **Impact** | Minor annoyance | Slows team weekly | Blocks features |
| **Risk** | Unlikely to cause issues | Could cause outage | Will cause outage |
| **Frequency** | Encountered rarely | Hit weekly | Hit daily |

### Priority Matrix

| Score | Priority | Action |
|-------|----------|--------|
| 8–10 | Critical | Fix this sprint, block new features if needed |
| 5–7 | High | Schedule within 2 sprints |
| 3–4 | Medium | Allocate in quarterly planning |
| 1–2 | Low | Fix opportunistically (boy-scout rule) |

---

## SECTION 4 — SCHEDULING STRATEGIES

### The 20% Rule

Reserve 20% of sprint capacity for tech debt. Non-negotiable.

### Debt Sprints

Every 6th sprint is a dedicated "health sprint":
- No new features
- Focus on highest-priority debt items
- Upgrade dependencies (`mvn versions:use-latest-releases` + OWASP check)
- Improve JaCoCo instruction coverage toward 80% threshold
- Replace H2 tests with Testcontainers PostgreSQL
- Write missing ADRs and update outdated skill files
- Run `mvn dependency:analyze` and clean unused declared deps

### Boy-Scout Rule (Continuous)

"Leave the code better than you found it."

When touching a class for a feature:
- Fix one small debt item in the same file.
- Add a missing unit test for an untested method.
- Replace `@Autowired` field injection with constructor injection.
- Add missing `@Valid` on a `@RequestBody` parameter you notice.
- Add Javadoc to an undocumented public service interface method.
- Replace `new BigDecimal(double)` with `new BigDecimal("string")`.

**Rule:** boy-scout improvements go in the same PR as the feature — don't create separate PRs for trivial fixes.

---

## SECTION 5 — PREVENTING DEBT ACCUMULATION

| Practice | How it prevents debt |
|----------|---------------------|
| Code review with `rules/code-review.md` checklist | Catches shortcuts and hard rule violations before merge |
| CI enforcement (Checkstyle, SpotBugs, PMD, JaCoCo, OWASP) | Automated quality gate — debt cannot merge silently |
| ADRs for architectural decisions | Prevents "why is this like this?" confusion |
| Spike tickets before large features | Explore before committing to an approach |
| Refactoring as part of feature work | Don't let debt compound |
| Regular dependency updates (Renovate weekly) | Prevents "big bang" Spring Boot / Java upgrades |
| `skills/common/code-style.md` Section 13 anti-patterns | Encodes lessons from real production incidents |

---

## SECTION 6 — JAVA-SPECIFIC DEBT PATTERNS TO WATCH

These Java anti-patterns accumulate silently and are expensive to fix at scale:

| Anti-pattern | Why it compounds | Fix |
|---|---|---|
| `@Autowired` field injection everywhere | Makes classes impossible to unit test without Spring context | Replace with constructor injection + `@RequiredArgsConstructor` |
| Entities at API boundary | Every new field leaks to consumers; security surface grows | Add DTO layer + `skills/spring-boot/SKILL.md` hard rule #2 |
| H2 in-memory in tests | Tests pass, production breaks — different SQL dialect, no constraints | Replace with Testcontainers PostgreSQL (`skills/common/testing.md`) |
| `spring.jpa.hibernate.ddl-auto=update` in staging/prod | Schema drift, data loss on rename, no migration audit trail | Enforce Flyway + `validate` mode everywhere |
| Missing `@Valid` on request bodies | Malformed data silently enters the DB | Add `@Valid` + `GlobalExceptionHandler` for 422 responses |
| `new BigDecimal(19.99)` for money | Floating-point rounding errors in financial calculations | `new BigDecimal("19.99")` everywhere |
| `System.out.println` logging | Cannot be disabled, level-filtered, or queried in production | Replace with `@Slf4j` + structured SLF4J logging |
| Catching `Exception` and returning `null` | Silent failures, impossible to diagnose | Throw typed `AppException` subclass |

---

## SECTION 7 — COMMUNICATING DEBT TO STAKEHOLDERS

Translate tech debt into business language:

| Technical framing (bad) | Business framing (good) |
|------------------------|------------------------|
| "We need to refactor the auth package" | "Auth changes take 3 days instead of 3 hours — fixing this saves 2 dev-weeks per quarter" |
| "We should upgrade to Java 21" | "We're on Java 17 — missing virtual threads means we need 3× the servers for the same concurrency" |
| "The test suite uses H2 instead of Postgres" | "We deploy bugs to production that our tests don't catch — two hotfixes last quarter were caused by this" |
| "We need to fix the Spring Boot 2.x → 3.x upgrade" | "Spring Boot 2.x security patches end in November — we have an unpatched CVE window after that" |
| "We need to add Flyway migrations" | "We can't do zero-downtime deploys without versioned migrations — every release needs a maintenance window" |
| "We should split the payment service" | "We can't scale the payment system independently — Black Friday will be a problem" |

**Rule:** always quantify debt in time, money, or risk. "It's messy" is not a business case.
