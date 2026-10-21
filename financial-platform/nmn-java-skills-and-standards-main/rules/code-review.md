# Code Review Guidelines

**Applies to:** All PRs across all Java Spring Boot projects.
**Audience:** Reviewers (leads, seniors) and authors.

---

## SECTION 1 — REVIEW CHECKLIST

### Correctness
- [ ] Does the code do what the ticket / PR description says?
- [ ] Are edge cases handled (null input, empty collections, boundary values, invalid formats)?
- [ ] Are error paths tested?
- [ ] Is `@Transactional` rollback behaviour correct under failure scenarios?

### Architecture & Layer Discipline
- [ ] Controller → Service → Repository → Model layer discipline enforced
- [ ] No business logic in controllers — controllers only validate, delegate, and return
- [ ] No JPA / DB calls in controllers — always via service layer
- [ ] Service interface + `impl/` implementation pattern followed
- [ ] Constructor injection only — no `@Autowired` on fields
- [ ] DTOs used at every API boundary — entities never returned from controllers
- [ ] `ResponseEntity<T>` return type on all controller methods

### Security
- [ ] No hardcoded secrets or credentials — all via `@ConfigurationProperties`
- [ ] `@Valid` on every `@RequestBody` parameter
- [ ] SQL injection prevented — Spring Data derived queries or JPQL named parameters only
- [ ] Auth checks present on new endpoints (`.permitAll()` only when explicitly public)
- [ ] `@PreAuthorize` at service layer for method-level security
- [ ] Sensitive data not logged or exposed in responses
- [ ] `@JsonIgnore` on `passwordHash` and all sensitive entity fields
- [ ] `SecureRandom` for security tokens (never `java.util.Random`)
- [ ] `MessageDigest.isEqual()` for secret comparisons (never `.equals()`)
- [ ] OWASP Section 11 checklist from `skills/common/security.md` verified for auth/payment changes

### Performance
- [ ] No N+1 queries — `@EntityGraph` or `JOIN FETCH` for eager associations
- [ ] `Pageable` + `Page<T>` on all list endpoints (never unbounded `findAll()`)
- [ ] Appropriate indexes for new query patterns (check `skills/common/db-design.md`)
- [ ] `@Cacheable` considered for expensive repeated reads
- [ ] HikariCP pool size appropriate for new DB access patterns
- [ ] `RestClient` / `WebClient` has explicit connect + read timeouts

### Maintainability
- [ ] Methods short and focused — split if doing too much (> 30 lines = warning)
- [ ] Single responsibility — one reason to change
- [ ] Clear naming — intent obvious without comments
- [ ] No dead code or commented-out blocks
- [ ] Javadoc on all public service interface methods, starting with an imperative verb
- [ ] TODO comments include ticket link and author

### Testing
- [ ] New service logic has `@ExtendWith(MockitoExtension.class)` unit tests
- [ ] New controller endpoints have `@WebMvcTest` slice tests
- [ ] New repository queries have `@DataJpaTest` + Testcontainers tests (no H2)
- [ ] Tests cover happy path + error paths (`ResourceNotFoundException`, `ValidationException` → HTTP 422)
- [ ] Test method names follow `methodName_scenario_expectedBehaviour` convention
- [ ] BDDMockito `given()` / `then().should()` style — never `when()` / `verify()`
- [ ] AssertJ `assertThat()` — never JUnit `assertEquals()`
- [ ] JaCoCo instruction coverage ≥ 80%

### Standards Compliance
- [ ] `google-java-format` clean — 2-space indent
- [ ] Checkstyle, SpotBugs, PMD clean (or suppressions are justified with comments)
- [ ] Typed `AppException` subclasses thrown — never bare `RuntimeException`
- [ ] `GlobalExceptionHandler` handles all HTTP mapping — no try/catch in controllers
- [ ] `BigDecimal` constructed from String for money (never `new BigDecimal(double)`)
- [ ] `@Transactional` on public methods only — private methods are silently ignored
- [ ] Flyway migration present for any schema change — never `ddl-auto=update`

---

## SECTION 2 — SEVERITY LEVELS

Use these prefixes in review comments:

| Prefix | Meaning | Blocks merge? |
|--------|---------|---------------|
| `🔴 BLOCKER:` | Security flaw, data loss risk, broken logic, entity exposed in API | Yes |
| `🟠 MUST FIX:` | Bug, missing test, hard rule violation, standards breach | Yes |
| `🟡 SUGGESTION:` | Better approach exists, readability improvement | No |
| `🟢 NIT:` | Style preference, minor naming | No |
| `💬 QUESTION:` | Clarification needed, not necessarily wrong | No |
| `👍 PRAISE:` | Good pattern, clever solution, well-tested | No |

**Rule:** Every review should include at least one `👍 PRAISE` comment. Positive reinforcement matters.

---

## SECTION 3 — FEEDBACK PATTERNS

### Good Feedback (actionable, specific, kind)

```
🔴 BLOCKER: Entity `Order` is being returned directly from the controller.
This exposes `passwordHash` and internal JPA metadata to the API consumer.
Map to `OrderResponse` via `OrderMapper.toResponse()` before returning.
Rule: skills/spring-boot/SKILL.md hard rule #2
```

```
🟠 MUST FIX: This query runs inside a loop — it will cause N+1.
Use @EntityGraph or a JOIN FETCH query instead:

@EntityGraph(attributePaths = {"items", "customer"})
List<Order> findByCustomerId(Long customerId);

See: skills/common/performance.md §N+1 prevention
```

```
🟠 MUST FIX: Missing @Valid on the @RequestBody parameter.
Without it, Bean Validation annotations on OrderRequest are silently ignored.
Add @Valid before @RequestBody OrderRequest request.
Rule: skills/spring-boot/SKILL.md hard rule #6
```

```
🟡 SUGGESTION: This service method can be simplified with Optional chaining:

return orderRepository.findById(id)
    .map(mapper::toResponse)
    .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
```

```
💬 QUESTION: Is there a reason we're not reusing the existing
OrderService.findById() here? Looks like it applies the same
ownership check.
```

```
👍 PRAISE: Great use of @RetryableTopic with exponential backoff here —
exactly the pattern from skills/kafka/SKILL.md. DLT handler is also
present. Well done.
```

### Bad Feedback (avoid)

- ❌ "This is wrong." (no explanation)
- ❌ "I would have done it differently." (not actionable)
- ❌ "Why didn't you...?" (accusatory)
- ❌ Rewriting the entire approach in a comment (open a discussion instead)

---

## SECTION 4 — REVIEWER RESPONSIBILITIES

1. **Respond within 4 business hours** — don't block teammates.
2. **Read the PR description first** — understand intent before reading code.
3. **Check out and run locally** for non-trivial changes (`mvn test`).
4. **Check the tests** — are they testing behaviour or implementation details?
5. **Approve when "good enough"** — don't pursue perfection on every PR.
6. **Escalate architectural concerns** — if the approach is fundamentally wrong, discuss synchronously before leaving 50 comments.
7. **Always check Flyway migrations** — verify they are backward-compatible and have a rollback strategy.

---

## SECTION 5 — AUTHOR RESPONSIBILITIES

1. **Keep PRs small** — under 400 lines changed (excluding generated code, Flyway migrations, and `target/`).
2. **Self-review before requesting** — read your own diff first.
3. **Write a clear PR description** — what changed, why, how to test.
4. **Respond to all comments** — even if just "done" or "won't fix because X".
5. **Don't take feedback personally** — reviews are about code, not you.
6. **Split large changes** — if a PR touches more than 3 concerns, break it up.
7. **Never merge your own PR** — always wait for at least 1 peer approval.
8. **Run the full CI pipeline locally before pushing** — `mvn verify` catches most issues before CI.

---

## SECTION 6 — WHEN TO REQUEST ADDITIONAL REVIEWERS

| Scenario | Who to add |
|----------|-----------|
| Security-sensitive changes (auth, crypto, permissions, JWT) | Security champion |
| Flyway database migrations | DBA or senior backend engineer |
| Infrastructure / deployment changes | DevOps lead |
| API contract changes (new fields, status codes, endpoint paths) | Frontend lead + API consumers |
| New architectural pattern (new skill, new framework integration) | Tech lead / architect |
| Performance-sensitive changes (new queries, caching strategy) | Performance specialist |
| Kafka schema / event contract changes | All consuming service teams |

---

## SECTION 7 — REVIEW TURNAROUND SLA

| PR Size | Expected turnaround |
|---------|-------------------|
| < 100 lines | Same day (4 hours) |
| 100–400 lines | Next business day |
| > 400 lines | Author should split; reviewer may request split |

---

## SECTION 8 — JAVA-SPECIFIC INSTANT BLOCKERS

The following are **immediate blockers** — raise as `🔴 BLOCKER` without waiting for the full review:

| Finding | Rule reference |
|---------|---------------|
| Entity returned directly from controller | `skills/spring-boot/SKILL.md` hard rule #2 |
| `@Autowired` field injection | `skills/spring-boot/SKILL.md` hard rule #1 |
| Missing `@Valid` on `@RequestBody` | `skills/spring-boot/SKILL.md` hard rule #6 |
| `new BigDecimal(double)` for money | `skills/common/code-style.md §13.8` |
| `@Transactional` on private method | `skills/common/code-style.md §13.4` |
| Hardcoded secret / credential | `skills/common/security.md §1` |
| `System.out.println` in production code | `skills/common/logging.md` |
| `java.util.Random` for security token | `skills/common/security.md §10` |
| Empty `catch` block swallowing exception | `skills/common/error-handling.md §9` |
| Flyway migration modified after merge | `skills/common/data-migrations.md` |
| `ddl-auto=update` in non-local config | `skills/spring-boot/SKILL.md` hard rule #9 |
