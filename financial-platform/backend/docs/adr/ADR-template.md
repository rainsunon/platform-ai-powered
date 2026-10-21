# ADR-NNN: [Title — Short Decision Statement]

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX
**Date:** YYYY-MM-DD
**Deciders:** [Names of people involved in the decision]
**Ticket:** [JIRA/Linear ticket reference]

---

## Context

What is the issue that we're seeing that is motivating this decision or change? What forces are at play (technical, business, team, timeline)?

## Decision

What is the change that we're proposing and/or doing? State it as an imperative: "We will..."

## Consequences

What becomes easier or more difficult to do because of this change?

### Positive
- ...

### Negative
- ...

### Risks
- ...

---

## Alternatives Considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| Option A | ... | ... | ... |
| Option B | ... | ... | ... |

---

## References

- Links to relevant docs, RFCs, blog posts, benchmarks

---

---

# EXAMPLE: ADR-001 — Use Spring Data JPA + PostgreSQL + Flyway as Data Layer

**Status:** Accepted
**Date:** 2026-01-15
**Deciders:** Nishant, Arpit, Deepika
**Ticket:** PLAT-42

---

## Context

We need a data layer for new Spring Boot services. Options span plain `JdbcTemplate`, Spring Data JPA with Hibernate, and jOOQ. We need first-class PostgreSQL support, clean entity mapping, compile-time query safety where possible, and a migration strategy that is safe for zero-downtime deployments. We also need a solution familiar to the majority of the NMN Java team.

## Decision

We will use **Spring Data JPA + Hibernate** as the ORM layer with **PostgreSQL** as the database, **HikariCP** as the connection pool (Spring Boot default), and **Flyway** for schema migrations. Monetary values use `BigDecimal` constructed from `String`. All schema changes go through Flyway — `spring.jpa.hibernate.ddl-auto` is set to `validate` in non-local environments.

## Consequences

### Positive
- Spring Data derived queries and JPQL eliminate most boilerplate.
- Flyway gives a versioned, auditable migration history safe for zero-downtime deployments.
- `validate` mode on startup catches entity/schema drift immediately, before traffic hits.
- Familiar to the entire NMN Java team — low onboarding cost.
- `@EntityGraph` and `JOIN FETCH` give explicit control over loading strategy when needed.

### Negative
- JPA magic (lazy loading, N+1, session scope) requires discipline — developers must understand the ORM to avoid silent performance issues.
- Complex queries (window functions, lateral joins, bulk upserts) are awkward in JPQL — need native `@Query` or `JdbcTemplate`.
- Flyway Community has no `down` migrations — irreversible migrations require expand-contract patterns.

### Risks
- N+1 query trap — always review `@OneToMany` and `@ManyToMany` fetch strategies.
- `LazyInitializationException` if entities escape the transaction boundary — enforced by DTO boundary rule.
- Lock-in to relational model — document if a service would benefit from a document or time-series store.

---

## Alternatives Considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| Plain `JdbcTemplate` | No ORM magic; full SQL control | Verbose row mapping; no derived queries; no entity graph | Maintenance burden at scale for CRUD-heavy services |
| jOOQ | Type-safe SQL at compile time; full SQL expressiveness | Commercial license for Postgres; steep learning curve; schema codegen in CI | Licensing cost + power-to-weight ratio not justified for most CRUD services |
| Spring Data R2DBC (reactive) | Non-blocking; good for high-concurrency I/O | No JPA; no lazy loading; dual datasource needed for Flyway; steeper learning curve | Default stack is Spring MVC; WebFlux only when explicitly needed (see skills/spring-webflux/SKILL.md) |
| Liquibase (instead of Flyway) | XML/YAML/JSON changesets; built-in rollback | More complex syntax; overkill for most projects | Flyway SQL migrations are simpler, reviewable, and sufficient |

---

## References

- [Spring Data JPA docs](https://docs.spring.io/spring-data/jpa/reference/)
- [Flyway documentation](https://flywaydb.org/documentation/)
- [HikariCP configuration](https://github.com/brettwooldridge/HikariCP#gear-configuration-knobs-baby)
- [NMN db-design.md](../../skills/common/db-design.md)
- [NMN data-migrations.md](../../skills/common/data-migrations.md)

---

---

# HOW TO USE THIS TEMPLATE

1. Copy this file: `cp ADR-template.md ADR-NNN-short-title.md`
2. Number sequentially: ADR-001, ADR-002, etc.
3. Fill in all sections — "Alternatives Considered" is mandatory.
4. Submit as a PR for team review.
5. Once accepted, it is immutable — create a new ADR to supersede it.

## When to Write an ADR

- Choosing a database, message broker, or major library.
- Changing authentication / authorization approach (e.g. JWT → OAuth2, Spring Security upgrade).
- Adopting a new architectural pattern (e.g. adding WebFlux, Kafka, gRPC).
- Choosing between Spring MVC and Spring WebFlux.
- Adding a new framework skill to this repo.
- Making a decision that is expensive to reverse.
- Any decision where future-you will ask "why did we do this?"

## ADR Status Lifecycle

```
Proposed → Accepted → (Deprecated | Superseded by ADR-XXX)
```

- **Proposed** — written, submitted as PR, under team review
- **Accepted** — merged, in effect, immutable
- **Deprecated** — no longer recommended but not replaced
- **Superseded** — replaced by a newer ADR (link to it)
