---
status: accepted
date: 2024-01-10
deciders: Arpit Gaur, NMN Engineering Platform
---

# ADR-003: Use Testcontainers (real PostgreSQL) — never H2 in-memory

## Context

Integration tests that hit the database need a DB to run against. Two common options:
H2 in-memory (fast to start, no Docker required) vs Testcontainers running real PostgreSQL.

We had two incidents in Q4 2023 where tests passed with H2 but deployments failed in production
because H2 does not enforce the same constraints as PostgreSQL and does not support
PostgreSQL-specific syntax (CTEs, `ON CONFLICT`, partial indexes, `JSONB`, `ILIKE`, etc.).

## Decision

All `@DataJpaTest` and `@SpringBootTest` integration tests must use a real PostgreSQL container
via Testcontainers. H2 in-memory is banned for integration tests.

## Rationale

- H2 has a different SQL dialect — `@Query` annotations using PostgreSQL syntax fail silently or are not tested.
- H2 does not enforce `CHECK` constraints by default — constraint violations that fail in production pass in tests.
- Testcontainers with `postgres:16-alpine` starts in < 10 seconds on CI — acceptable overhead.
- `@DataJpaTest` + `@AutoConfigureTestDatabase(replace = Replace.NONE)` + `@DynamicPropertySource` is the standard pattern.
- The `spring.test.database.replace=none` property disables the default H2 replacement globally.

## Consequences

- Docker must be available in the CI environment (standard on GitHub Actions).
- Developers must have Docker Desktop running locally for integration test execution.
- Tests tagged `@Tag("integration")` run in a separate Maven Failsafe execution: `mvn verify -P integration-tests`.
- The shared Testcontainer pattern (static `@Container`) reuses a single container across the test class to keep test times acceptable.
- H2 may still be used as a dependency for tools that require it (e.g., Spring Shell), but never as the test datasource.
