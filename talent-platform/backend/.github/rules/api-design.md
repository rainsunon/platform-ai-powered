# REST API Design Standards

> Consistent, predictable, versioned REST APIs.

---

## 1. URL Structure

```
/api/v1/{resource}              ← Collection
/api/v1/{resource}/{id}         ← Single item
/api/v1/{resource}/{id}/{sub}   ← Sub-resource
```

**Rules:**
- Use **nouns**, never verbs: `/api/v1/users` not `/api/v1/getUsers`
- Always **plural**: `/users`, `/orders`, `/products`
- **kebab-case** for multi-word resources: `/user-profiles`
- Always version with `/v1/` — never unversioned URLs in production
- Nest only one level deep: `/orders/{id}/items` — not `/orders/{id}/items/{itemId}/details`

---

## 2. HTTP Methods

| Method | Use | Idempotent | Success code |
|--------|-----|------------|-------------|
| `GET` | Read (list or single) | ✅ | `200` |
| `POST` | Create | ❌ | `201` + `Location` header |
| `PUT` | Full replacement | ✅ | `200` |
| `PATCH` | Partial update | ✅ | `200` |
| `DELETE` | Delete | ✅ | `204` |

Never use `GET` to modify data. Never use `POST` for search (use query params instead).

---

## 3. HTTP Status Codes

| Code | When |
|------|------|
| `200 OK` | Successful `GET`, `PUT`, `PATCH` |
| `201 Created` | Successful `POST` — always include `Location` header |
| `204 No Content` | Successful `DELETE` or action with no response body |
| `400 Bad Request` | Malformed request syntax (unparseable JSON, wrong content type) |
| `401 Unauthorized` | Missing or invalid authentication — never `403` for unauthenticated |
| `403 Forbidden` | Authenticated but not authorised |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Duplicate resource or state conflict |
| `422 Unprocessable Entity` | Schema / business validation failure (`@Valid` violations) |
| `429 Too Many Requests` | Rate limit exceeded — include `Retry-After` header |
| `500 Internal Server Error` | Unexpected server error — never expose stack traces |
| `502 Bad Gateway` | Upstream service unavailable |

**Spring Boot mapping — `GlobalExceptionHandler`:**

```java
// AppException subclass → HTTP status — one place, no exceptions
ResourceNotFoundException   → 404
ValidationException         → 422
ConflictException           → 409
ForbiddenException          → 403
UnauthorizedException       → 401
RateLimitedException        → 429
ExternalServiceException    → 502
Exception (catch-all)       → 500
```

---

## 4. Request / Response Shape

### Request (POST / PUT / PATCH)
```json
{
  "email": "user@example.com",
  "name": "Jane Doe",
  "role": "editor"
}
```

### Success Response (single item)
```json
{
  "id": 1,
  "publicId": "a1b2c3d4-...",
  "email": "user@example.com",
  "name": "Jane Doe",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

### Success Response (list — Spring `Page<T>`)
```json
{
  "content": [ ... ],
  "page": {
    "totalElements": 250,
    "totalPages": 13,
    "number": 2,
    "size": 20
  }
}
```

### Error Response
```json
{
  "status": 422,
  "errorCode": "VALIDATION_ERROR",
  "message": "Request validation failed.",
  "path": "/api/v1/users",
  "timestamp": "2026-01-15T10:30:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "fieldViolations": [
    { "field": "email", "message": "Invalid email format." },
    { "field": "name",  "message": "Name is required." }
  ]
}
```

**Java record:**
```java
// exception/ApiErrorResponse.java
public record ApiErrorResponse(
    int          status,
    String       errorCode,       // machine-readable: "NOT_FOUND", "VALIDATION_ERROR"
    String       message,         // human-readable
    String       path,
    Instant      timestamp,
    String       requestId,       // from MDC — correlates with distributed traces
    List<FieldViolation> fieldViolations
) {
  public record FieldViolation(String field, String message) {}
}
```

---

## 5. Pagination

Always paginate list endpoints. Never return unbounded lists.
Use Spring's `Pageable` — it maps query params automatically.

```
GET /api/v1/users?page=0&size=20&sort=createdAt,desc
```

| Param | Default | Max | Notes |
|-------|---------|-----|-------|
| `page` | `0` | — | 0-based (Spring default) |
| `size` | `20` | `100` | enforce max in controller |
| `sort` | `createdAt,desc` | — | `{field},{asc\|desc}` |

```java
// Controller
@GetMapping
public ResponseEntity<Page<UserResponse>> listUsers(
    @PageableDefault(size = 20, sort = "createdAt",
                     direction = Sort.Direction.DESC) Pageable pageable) {
  return ResponseEntity.ok(userService.findAll(pageable));
}

// Service
public Page<UserResponse> findAll(Pageable pageable) {
  return userRepository.findAll(pageable)
      .map(mapper::toResponse);
}
```

Prefer cursor pagination for very large datasets or real-time feeds:

```
GET /api/v1/orders?cursor=eyJpZCI6MTAwMH0&size=20
```

---

## 6. Filtering, Sorting, Search

```
GET /api/v1/users?active=true&role=ADMIN        ← filter
GET /api/v1/users?sort=createdAt,desc           ← sort (Spring Pageable)
GET /api/v1/users?search=jane                   ← full-text search
```

Never expose raw DB column names in filters — use a whitelist of allowed filter fields.

```java
// Whitelist allowed sort fields — prevent DB column enumeration
private static final Set<String> ALLOWED_SORT_FIELDS =
    Set.of("createdAt", "updatedAt", "name", "email");

@GetMapping
public ResponseEntity<Page<UserResponse>> listUsers(
    @RequestParam(required = false) String role,
    @RequestParam(required = false) Boolean active,
    @PageableDefault(size = 20) Pageable pageable) {

  // Validate sort fields against whitelist
  pageable.getSort().forEach(order -> {
    if (!ALLOWED_SORT_FIELDS.contains(order.getProperty()))
      throw new ValidationException("sort", "Invalid sort field: " + order.getProperty());
  });

  return ResponseEntity.ok(userService.findAll(role, active, pageable));
}
```

---

## 7. Versioning

- All breaking changes require a new version: `/api/v2/`.
- Old versions deprecated with `Sunset` and `Deprecation` headers before removal.
- Minimum 3 months deprecation window.
- Provider maintains N and N-1 versions simultaneously.

```
Deprecation: Sat, 31 Dec 2026 00:00:00 GMT
Sunset: Sat, 31 Mar 2027 00:00:00 GMT
Link: </api/v2/users>; rel="successor-version"
```

```java
// Spring — route by Accept header for internal APIs
@GetMapping(value = "/{id}", produces = "application/vnd.nmn.v2+json")
public ResponseEntity<UserResponseV2> getUserV2(@PathVariable Long id) { ... }

@GetMapping(value = "/{id}", produces = "application/vnd.nmn.v1+json")
public ResponseEntity<UserResponseV1> getUserV1(@PathVariable Long id) { ... }
```

---

## 8. API Documentation

Every endpoint must have:
- Summary (one line)
- Description (when not obvious)
- All parameters documented
- All response schemas documented
- Example request / response

Use **`springdoc-openapi`** to generate OpenAPI 3.1 from annotations:

```java
@Operation(
    summary     = "Get user by ID",
    description = "Returns a single user. Requires VIEWER role or higher."
)
@ApiResponse(responseCode = "200", description = "User found")
@ApiResponse(responseCode = "401", description = "Unauthorized")
@ApiResponse(responseCode = "403", description = "Forbidden")
@ApiResponse(responseCode = "404", description = "User not found",
    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
@GetMapping("/{id}")
public ResponseEntity<UserResponse> findById(@PathVariable Long id) { ... }
```

```xml
<!-- pom.xml -->
<dependency>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
  <version>2.5.0</version>
</dependency>
```

```yaml
# application.yml
springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html
    enabled: true   # disable in production: ${SWAGGER_ENABLED:false}
```

---

## 9. Datetime Format

Always ISO 8601 UTC: `"2026-01-15T10:30:00Z"`

Never return Unix timestamps to API consumers.

```java
// application.yml — configure Jackson globally
spring:
  jackson:
    serialization:
      write-dates-as-timestamps: false   # ISO 8601 string, not epoch millis
    time-zone: UTC
    date-format: yyyy-MM-dd'T'HH:mm:ss'Z'

// Entity / DTO — always use java.time types, never java.util.Date
public record UserResponse(
    Long          id,
    String        email,
    LocalDateTime createdAt,   // serialised as "2026-01-15T10:30:00" by Jackson
    Instant       updatedAt    // serialised as "2026-01-15T10:30:00Z" (preferred for API)
) {}
```

Use `Instant` for timestamps returned in API responses — it always includes `Z` (UTC offset).
Use `LocalDate` for date-only fields (no time component).
Use `LocalDateTime` for internal storage when timezone is managed by the application.

---

## 10. Sensitive Fields — Never Return

`passwordHash`, `secretKey`, `internalId`, `ssn`, `rawToken`, `salt`, `apiKeyHash`.

```java
// WRONG — entity returned directly from controller
@GetMapping("/{id}")
public ResponseEntity<User> findById(@PathVariable Long id) {
  return ResponseEntity.ok(userRepository.findById(id).orElseThrow());
  // CRITICAL: exposes passwordHash, internal fields, JPA proxy metadata
}

// CORRECT — always map to response DTO
@GetMapping("/{id}")
public ResponseEntity<UserResponse> findById(@PathVariable Long id) {
  return ResponseEntity.ok(userService.findById(id)); // service returns DTO
}

// Belt-and-braces: @JsonIgnore on sensitive entity fields
// even if entity accidentally reaches the serializer
@Column(name = "password_hash", nullable = false)
@JsonIgnore   // never serialised — even if entity leaks accidentally
private String passwordHash;
```

---

## 11. Standard Headers

### Request headers (always handle)

| Header | Purpose |
|--------|---------|
| `Authorization: Bearer {token}` | JWT authentication |
| `X-Request-ID` | Distributed tracing — generate if absent |
| `Content-Type: application/json` | Required on POST/PUT/PATCH |
| `Accept: application/json` | Expected response format |

### Response headers (always set)

| Header | Purpose |
|--------|---------|
| `X-Request-ID` | Echo back — correlates request with logs and traces |
| `Content-Type: application/json` | Always set explicitly |
| `Location: /api/v1/users/{id}` | Required on `201 Created` responses |
| `Retry-After: {seconds}` | Required on `429 Too Many Requests` |

```java
// Controller — 201 Created with Location header
@PostMapping
public ResponseEntity<UserResponse> create(
    @Valid @RequestBody CreateUserRequest request) {
  UserResponse created = userService.create(request);
  URI location = ServletUriComponentsBuilder
      .fromCurrentRequest()
      .path("/{id}")
      .buildAndExpand(created.id())
      .toUri();
  return ResponseEntity.created(location).body(created);
}
```

---

## 12. Money Fields

Always return monetary values as `String` with 2 decimal places — never `double` or `float`.

```json
{
  "price":    "19.99",
  "discount": "2.50",
  "total":    "17.49",
  "currency": "INR"
}
```

```java
// DTO
public record ProductResponse(
    Long   id,
    String name,
    String price,     // String — never BigDecimal directly (precision in JSON)
    String currency
) {}

// Mapper
public ProductResponse toResponse(Product product) {
  return new ProductResponse(
      product.getId(),
      product.getName(),
      product.getPrice().toPlainString(),  // BigDecimal → String, no scientific notation
      product.getCurrency()
  );
}
```
