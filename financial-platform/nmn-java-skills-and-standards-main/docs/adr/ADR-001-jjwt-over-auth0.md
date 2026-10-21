---
status: accepted
date: 2024-01-10
deciders: Arpit Gaur, NMN Engineering Platform
---

# ADR-001: Use io.jsonwebtoken (jjwt) as the JWT library

## Context

Two Java JWT libraries are widely used: `io.jsonwebtoken:jjwt-api` and `com.auth0:java-jwt`.
We needed to standardise on one to avoid conflicting patterns across projects.

## Decision

We use `io.jsonwebtoken:jjwt-api` (version 0.12.x+) across all Java Spring Boot services.

## Rationale

| Factor | jjwt | auth0/java-jwt |
|--------|------|----------------|
| API style | Fluent builder, compile-safe | More verbose, string-based claim access |
| Spring Boot integration | First-class, commonly shown in Spring docs | Works but less Spring-idiomatic |
| Custom claims | Type-safe `Claims` access | `getClaim("key", Class)` — less ergonomic |
| Maintenance | Active, Spring-aligned releases | Active |
| Key management | Supports HMAC, RSA, EC out of the box | Same |

The jjwt 0.12.x API (`Jwts.builder()`, `Jwts.parserBuilder()`) is cleaner and aligns with how Spring Security documentation demonstrates JWT configuration.

## Consequences

- All projects must use `io.jsonwebtoken:jjwt-api` + `jjwt-impl` + `jjwt-jackson`.
- Do not add `com.auth0:java-jwt` as a dependency — it creates duplicate JWT handling paths.
- Upgrade path: jjwt 0.12.x introduced breaking changes from 0.11.x — see migration guide before upgrading.
