---
status: accepted
date: 2024-01-10
deciders: Arpit Gaur, NMN Engineering Platform
---

# ADR-002: Use Flyway for database migrations (not Liquibase)

## Context

Both Flyway and Liquibase are mature schema migration tools. Spring Boot supports both.
We needed a single standard to prevent mixed usage across projects.

## Decision

We use Flyway across all Java Spring Boot services. Liquibase is not permitted.

## Rationale

| Factor | Flyway | Liquibase |
|--------|--------|-----------|
| Migration format | Plain SQL (primary) | XML/YAML/JSON/SQL |
| Learning curve | Low — just write SQL | Higher — XML DSL abstraction |
| Debugging | Read the SQL | Translate XML → SQL in your head |
| Spring Boot support | First-class auto-configuration | First-class auto-configuration |
| DBA collaboration | DBAs can read/write SQL directly | Requires Liquibase knowledge |
| Zero-downtime patterns | Well documented (expand-contract) | Possible but more complex |

Flyway SQL migrations are readable by everyone on the team — developers and DBAs alike.
The expand-contract pattern for zero-downtime deploys is well-documented and tested.

## Consequences

- All schema changes must use Flyway versioned migrations (`V{n}__{description}.sql`).
- `spring.jpa.hibernate.ddl-auto=validate` in non-local environments — never `update`.
- `ddl-auto=update` is only acceptable in `local` profile for rapid prototyping.
- Existing projects on Liquibase must migrate when upgrading to this standard (planned work).
