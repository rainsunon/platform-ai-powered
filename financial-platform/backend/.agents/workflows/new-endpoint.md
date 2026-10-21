---
name: new-endpoint
description: Scaffold a new REST API endpoint following NMN Java Spring Boot standards
---

# Create New API Endpoint

## Steps

1. Read `rules/api-design.md` for URL and response conventions.
2. Read the framework skill (`skills/spring-boot/SKILL.md` or `skills/spring-webflux/SKILL.md`).
3. Define the request DTO in `api/dto/request/` — annotate with `@Valid` constraints.
4. Define the response DTO in `api/dto/response/` — use Java `record` where possible.
5. Add or extend the service interface method in `service/` with Javadoc.
6. Implement the method in `service/impl/` — annotate reads with `@Transactional(readOnly = true)`, writes with `@Transactional`.
7. Add or extend the repository method in `repository/` if DB access is needed — use Spring Data derived query or JPQL named parameter.
8. Add the mapper method in `mapper/` to convert entity ↔ DTO.
9. Add the handler method in `api/v1/` — annotate with `@Valid @RequestBody`, return `ResponseEntity<T>`.
10. Write tests:
    - Service: `@ExtendWith(MockitoExtension.class)` unit tests with Mockito stubs — happy path + edge case + error path.
    - Controller: `@WebMvcTest` slice test exercising bind / validate / error paths via `MockMvc`.
    - Repository (if new query): `@DataJpaTest` with real Postgres Testcontainer.
11. Run before pushing:
    ```bash
    mvn spotless:check
    mvn checkstyle:check
    mvn test
    mvn verify
    ```

## Conventions

- URL: `/api/v1/{resource}` — plural nouns, kebab-case.
- Response: `{"data": {...}}` single, `{"data": [...], "pagination": {...}}` list.
- Error: `{"error": {"code": "MACHINE_CODE", "message": "Human message"}}`.
- Always paginate list endpoints — default page size 20, max 100; validate in service layer.
- All endpoints authenticated via Spring Security unless explicitly marked `.permitAll()` in `SecurityFilterChain`.
- Map repository / JPA exceptions to typed `AppException` subclasses in the service layer — never let `DataAccessException` or Hibernate exceptions leak to the controller.
- Return `ResponseEntity<T>` on all controller methods — no raw return types.
- Use `@AuthenticationPrincipal UserPrincipal` to access the authenticated user — never read user identity from request parameters.
