# Security — Enterprise Standard

**Applies to:** All Spring Boot projects handling user data, authentication, or external APIs.
**Authority:** OWASP Top 10 (2021), CWE/SANS Top 25, PCI DSS for payment code, GDPR for PII handling.

---

## SECTION 1 — SECRETS MANAGEMENT

### 1.1 Non-negotiable rules

```java
// RULE 1 — No secrets in source code. Ever. No exceptions.
String dbUrl = "jdbc:postgresql://localhost/mydb?user=admin&password=secret"; // WRONG — git history is forever

// RULE 2 — All secrets via environment variables.
String dbUrl = appProperties.getDatabase().getUrl(); // CORRECT

// RULE 3 — Use a typed @ConfigurationProperties class populated from env at startup.
```

```java
// config/AppProperties.java
package com.nmn.demo.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import java.util.List;

/**
 * Typed configuration loaded from environment variables / application.yml.
 *
 * Spring Boot fails fast on startup if a @NotBlank required field is missing,
 * preventing partially-configured services from starting.
 *
 * Enable with: @EnableConfigurationProperties(AppProperties.class) on @SpringBootApplication.
 */
@ConfigurationProperties(prefix = "app")
@Validated
public record AppProperties(

    @NotBlank String name,
    Jwt jwt,
    Cors cors

) {
    /** JWT configuration. Secret must be at least 32 characters. */
    public record Jwt(
        @NotBlank String secret,
        @Min(300_000)   long expirationMs,          // min 5 minutes
        @Min(3_600_000) long refreshExpirationMs    // min 1 hour
    ) {
        public Jwt {
            if (secret.length() < 32)
                throw new IllegalStateException(
                    "app.jwt.secret must be at least 32 characters");
        }
    }

    /** CORS allowed origins — never wildcard in production. */
    public record Cors(List<String> allowedOrigins) {}
}
```

```yaml
# application.yml — keys present, no real values, descriptive comments
app:
  name: my-service
  jwt:
    secret: ${JWT_SECRET}                               # min 32 chars, random
    expiration-ms: ${JWT_EXPIRATION_MS:900000}          # 15 minutes default
    refresh-expiration-ms: ${JWT_REFRESH_MS:604800000}  # 7 days default
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000}

spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
```

### 1.2 .env.example — always committed

```bash
# .env.example — all keys present, no real values, descriptive comments
DATABASE_URL=jdbc:postgresql://localhost:5432/mydb
DATABASE_USERNAME=user
DATABASE_PASSWORD=change-me
JWT_SECRET=change-me-to-a-random-32-plus-character-string
JWT_EXPIRATION_MS=900000
JWT_REFRESH_MS=604800000
CORS_ALLOWED_ORIGINS=https://app.example.com
```

### 1.3 Production secrets management

Never use `.env` files in production. Use:

- AWS Secrets Manager / Parameter Store (`spring-cloud-aws-secrets-manager`)
- HashiCorp Vault (`spring-cloud-vault`)
- GCP Secret Manager (`spring-cloud-gcp-secretmanager`)
- Azure Key Vault (`azure-spring-boot-starter-keyvault-secrets`)
- Kubernetes Secrets (with encryption at rest, mounted as environment variables)

---

## SECTION 2 — AUTHENTICATION

### 2.1 JWT Standards

```java
// security/JwtService.java
package com.nmn.demo.security;

import com.nmn.demo.config.AppProperties;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class JwtService {

    private static final String CLAIM_ROLES  = "roles";
    private static final String CLAIM_TYPE   = "typ";
    private static final String TOKEN_ISSUER = "nmn";
    private static final String TYPE_ACCESS  = "access";
    private static final String TYPE_REFRESH = "refresh";

    private final AppProperties props;

    /** Issues a signed access token valid for app.jwt.expiration-ms. */
    public String generateAccessToken(UserDetails user, List<String> roles) {
        return buildToken(user.getUsername(), TYPE_ACCESS,
                props.jwt().expirationMs(),
                Map.of(CLAIM_ROLES, roles));
    }

    /** Issues a signed refresh token valid for app.jwt.refresh-expiration-ms. */
    public String generateRefreshToken(UserDetails user) {
        return buildToken(user.getUsername(), TYPE_REFRESH,
                props.jwt().refreshExpirationMs(), Map.of());
    }

    /** Validates signature, expiry, issuer, and token type = "access". */
    public boolean isAccessTokenValid(String token, UserDetails user) {
        return isTokenValid(token, user, TYPE_ACCESS);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        return extractClaim(token, c -> c.get(CLAIM_ROLES, List.class));
    }

    // ── private ──────────────────────────────────────────────────────────────

    private boolean isTokenValid(String token, UserDetails user, String expectedType) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.getSubject().equals(user.getUsername())
                && expectedType.equals(claims.get(CLAIM_TYPE, String.class))
                && TOKEN_ISSUER.equals(claims.getIssuer())
                && !claims.getExpiration().before(Date.from(Instant.now()));
        } catch (JwtException ex) {
            return false; // expired, tampered, or wrong algorithm
        }
    }

    private String buildToken(String subject, String type,
                               long expirationMs, Map<String, Object> extras) {
        Instant now = Instant.now();
        return Jwts.builder()
                .claims(extras)
                .claim(CLAIM_TYPE, type)
                .subject(subject)
                .issuer(TOKEN_ISSUER)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .requireIssuer(TOKEN_ISSUER)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(props.jwt().secret()));
    }
}
```

### 2.2 Password Hashing

```java
// config/SecurityConfig.java
// Strength 12 ≈ 300ms per hash on modern hardware — intentionally slow.
// Never call passwordEncoder.encode() in a hot path or loop.
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
}

// In AuthService — CORRECT
public void register(RegisterRequest req) {
    String hash = passwordEncoder.encode(req.password());
    userRepository.save(new User(req.email(), hash));
}

// Verify — BCrypt comparison is constant-time
public boolean verifyPassword(String plain, String storedHash) {
    return passwordEncoder.matches(plain, storedHash); // CORRECT
}

// WRONG — never store plain text
user.setPassword(req.password()); // CRITICAL VULNERABILITY

// WRONG — never compare with .equals() (timing-attackable)
if (user.getPassword().equals(req.password())) { ... } // CRITICAL
```

**Alternative:** `Argon2PasswordEncoder` — the OWASP-recommended modern choice.
`BCryptPasswordEncoder(12)` is still acceptable for greenfield projects.

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8(); // Argon2id
}
```

---

## SECTION 3 — INPUT VALIDATION

### 3.1 All user input passes through @Valid before use

Spring Boot uses `jakarta.validation` (Bean Validation 3.0). Declare constraints on request DTOs.

```java
// dto/request/CreateUserRequest.java
public record CreateUserRequest(

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    @Size(max = 254, message = "Email must not exceed 254 characters")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 128, message = "Password must be 8–128 characters")
    String password,

    @NotBlank(message = "Name is required")
    @Size(min = 1, max = 100)
    String name,

    @Min(0) @Max(150)
    Integer age,

    @Pattern(regexp = "viewer|editor|admin",
             message = "Role must be viewer, editor, or admin")
    String role

) {}

// Controller — @Valid triggers validation; violation throws MethodArgumentNotValidException
@PostMapping("/users")
public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED).body(userService.create(req));
}
```

`MethodArgumentNotValidException` is caught by `GlobalExceptionHandler` and returns
`400` with per-field errors — see `skills/common/error-handling.md`.

### 3.2 Custom validation rules

```java
// validation/PasswordComplexity.java — constraint annotation
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordComplexityValidator.class)
public @interface PasswordComplexity {
    String message() default
        "Password must contain uppercase, lowercase, digit, and special character";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// validation/PasswordComplexityValidator.java
public class PasswordComplexityValidator
        implements ConstraintValidator<PasswordComplexity, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext ctx) {
        if (value == null) return false;
        boolean hasUpper   = value.chars().anyMatch(Character::isUpperCase);
        boolean hasLower   = value.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit   = value.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = value.chars().anyMatch(c -> !Character.isLetterOrDigit(c));
        return hasUpper && hasLower && hasDigit && hasSpecial;
    }
}

// Usage on the DTO field
@PasswordComplexity
String password;
```

### 3.3 Never trust client-controlled values

```java
// WRONG — using a client-supplied user ID
@GetMapping("/profile")
public ResponseEntity<UserResponse> getProfile(@RequestParam Long userId) {
    return ResponseEntity.ok(userService.findById(userId));
    // BUG: any authenticated user can read anyone's data
}

// CORRECT — extract the authenticated user from the security context
@GetMapping("/profile")
public ResponseEntity<UserResponse> getProfile(
        @AuthenticationPrincipal UserDetails principal) {
    return ResponseEntity.ok(userService.findByEmail(principal.getUsername()));
}
```

---

## SECTION 4 — SQL INJECTION PREVENTION

```java
// CORRECT — Spring Data derived queries (parameterised automatically)
Optional<User> findByEmailAndTenantId(String email, Long tenantId);

// CORRECT — JPQL with named parameters
@Query("SELECT u FROM User u WHERE u.email = :email AND u.tenantId = :tenantId")
Optional<User> findByEmailInTenant(@Param("email") String email,
                                    @Param("tenantId") Long tenantId);

// CORRECT — Native query with named parameters
@Query(value = "SELECT * FROM users WHERE email = :email", nativeQuery = true)
Optional<User> findByEmailNative(@Param("email") String email);

// CORRECT — JdbcTemplate always uses ? placeholders
String sql = "SELECT * FROM users WHERE email = ? AND tenant_id = ?";
jdbcTemplate.query(sql, rowMapper, email, tenantId);

// WRONG — EntityManager with string concatenation: classic SQL injection
String jpql = "SELECT u FROM User u WHERE u.email = '" + email + "'"; // CRITICAL
em.createQuery(jpql).getResultList();

// WRONG — JdbcTemplate with string concatenation
String sql = "SELECT * FROM users WHERE name = '" + name + "'";       // CRITICAL
jdbcTemplate.query(sql, rowMapper);

// WRONG — fmt-style string building into queries
String sql = String.format("SELECT * FROM users WHERE email = '%s'", email); // CRITICAL
```

---

## SECTION 5 — RATE LIMITING

Apply to authentication endpoints and public-facing APIs. Use Redis so limits hold across replicas.

```java
// filter/RateLimitFilter.java — using Bucket4j + Redis
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final ProxyManager<String> buckets;

    @Override
    protected void doFilterInternal(HttpServletRequest req,
            HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String key = "rl:" + getClientIp(req) + ":" + req.getRequestURI();

        Bucket bucket = buckets.builder()
            .addLimit(Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(1))))
            .build(key);

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        res.setHeader("X-RateLimit-Remaining",
            String.valueOf(probe.getRemainingTokens()));

        if (!probe.isConsumed()) {
            res.setHeader("Retry-After",
                String.valueOf(
                    TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill())));
            res.sendError(HttpStatus.TOO_MANY_REQUESTS.value(), "Too many requests");
            return;
        }
        chain.doFilter(req, res);
    }

    private String getClientIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        return (forwarded != null)
            ? forwarded.split(",")[0].trim()
            : req.getRemoteAddr();
    }
}
```

pom.xml dependency:
```xml
<dependency>
    <groupId>com.bucket4j</groupId>
    <artifactId>bucket4j-redis</artifactId>
    <version>8.10.1</version>
</dependency>
```

Apply selectively by registering the filter only on `/api/v1/auth/**` paths via `FilterRegistrationBean`.

---

## SECTION 6 — CORS

```java
// config/CorsConfig.java
@Configuration
@RequiredArgsConstructor
public class CorsConfig {

    private final AppProperties props;

    // WRONG — wildcard with credentials (browsers reject this combination anyway)
    // config.addAllowedOrigin("*");  ← never do this in production

    // CORRECT — explicit allowlist from config
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(props.cors().allowedOrigins()); // from env
        config.setAllowedMethods(
            List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(
            List.of("Authorization", "Content-Type", "X-Request-ID"));
        config.setExposedHeaders(List.of("X-Request-ID"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}

// Wire into SecurityFilterChain:
http.cors(cors -> cors.configurationSource(corsConfigurationSource));
```

---

## SECTION 7 — RESPONSE SANITISATION

Response DTOs are always distinct from JPA entities. Never return an entity from a controller.

```java
// model/User.java — internal JPA entity
@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(name = "password_hash", nullable = false)
    @JsonIgnore   // belt-and-braces: never serialised even if entity leaks accidentally
    private String passwordHash;

    @Column(nullable = false, length = 20)
    private String role;

    @CreationTimestamp
    private LocalDateTime createdAt;
}

// dto/response/UserResponse.java — wire shape; only public fields (Java record)
public record UserResponse(
    Long id,
    String email,
    String role,
    LocalDateTime createdAt
    // passwordHash intentionally absent
) {}

// mapper/UserMapper.java — entity → DTO at the service boundary
@Component
public class UserMapper {
    public UserResponse toResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getRole(),
            user.getCreatedAt()
        );
    }
}
```

**Belt-and-braces:** `@JsonIgnore` on `passwordHash` means accidental direct entity
serialisation will still never expose the hash. But the real fix is: entities must
never leave the service layer — always map before returning.

---

## SECTION 8 — DEPENDENCY SECURITY

```bash
# Run in CI — OWASP Dependency Check
mvn org.owasp:dependency-check-maven:check

# View available dependency updates
mvn versions:display-dependency-updates

# Update patch versions automatically
mvn versions:use-latest-releases
```

Fail the build if OWASP finds CVEs with CVSS ≥ 7:

```xml
<!-- pom.xml -->
<plugin>
    <groupId>org.owasp</groupId>
    <artifactId>dependency-check-maven</artifactId>
    <version>9.0.9</version>
    <configuration>
        <failBuildOnCVSS>7</failBuildOnCVSS>
        <suppressionFile>owasp-suppressions.xml</suppressionFile>
    </configuration>
    <executions>
        <execution>
            <goals><goal>check</goal></goals>
        </execution>
    </executions>
</plugin>
```

Pin all versions in the parent POM's `<dependencyManagement>` block.
Use Dependabot or Renovate to auto-PR dependency upgrades.

---

## SECTION 9 — SECURITY HEADERS

```java
// filter/SecurityHeadersFilter.java
@Component
public class SecurityHeadersFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest req,
            HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        res.setHeader("Strict-Transport-Security",
            "max-age=31536000; includeSubDomains; preload");
        res.setHeader("X-Content-Type-Options",  "nosniff");
        res.setHeader("X-Frame-Options",         "DENY");
        res.setHeader("Referrer-Policy",         "strict-origin-when-cross-origin");
        res.setHeader("Permissions-Policy",      "geolocation=(), microphone=(), camera=()");
        res.setHeader("Content-Security-Policy",
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self'; " +
            "img-src 'self' data:; " +
            "font-src 'self'; " +
            "object-src 'none'; " +
            "frame-ancestors 'none';");

        chain.doFilter(req, res);
    }
}
```

Or configure common headers via Spring Security's `HeadersConfigurer`:

```java
http.headers(headers -> headers
    .frameOptions(frame -> frame.deny())
    .contentTypeOptions(Customizer.withDefaults())
    .httpStrictTransportSecurity(hsts -> hsts
        .includeSubDomains(true)
        .maxAgeInSeconds(31536000)
        .preload(true)
    )
);
```

---

## SECTION 10 — CRYPTO RULES

```java
import java.security.SecureRandom;

// CORRECT — SecureRandom for tokens and IDs
SecureRandom secureRandom = new SecureRandom();
byte[] tokenBytes = new byte[32];
secureRandom.nextBytes(tokenBytes);
String token = HexFormat.of().formatHex(tokenBytes); // CORRECT

// WRONG — java.util.Random for security tokens
Random random = new Random();
byte[] tokenBytes = new byte[32];
random.nextBytes(tokenBytes); // CRITICAL — predictable; not cryptographically secure

// CORRECT — constant-time comparison for secrets (timing-safe)
import java.security.MessageDigest;
boolean equal = MessageDigest.isEqual(
    presented.getBytes(StandardCharsets.UTF_8),
    stored.getBytes(StandardCharsets.UTF_8)
);

// WRONG — .equals() on secret strings (timing-attackable)
if (presented.equals(stored)) { ... } // CRITICAL — timing attack possible

// CORRECT — UUID for non-secret public identifiers
UUID publicId = UUID.randomUUID(); // fine for public IDs, not security tokens

// CORRECT — Spring PasswordEncoder for anything password-like
passwordEncoder.matches(presented, storedHash); // BCrypt is constant-time internally
```

---

## SECTION 11 — SECURITY CHECKLIST FOR CODE REVIEW

Use this before approving any PR touching auth, payment, or user data:

```
[ ] No hardcoded credentials, tokens, or passwords anywhere in the diff
[ ] New endpoints have authentication applied (or explicitly documented as public via .permitAll())
[ ] New auth/login endpoints have rate limiting applied
[ ] All @RequestBody parameters carry @Valid — without exception
[ ] No string-built JPQL or SQL — all queries use :named parameters or derived methods
[ ] Response DTO does not expose sensitive fields (no passwordHash, no internal system fields)
[ ] Passwords hashed with BCryptPasswordEncoder(12) or Argon2PasswordEncoder before storage
[ ] JWT validated: signature + expiry + issuer + token type all checked
[ ] @JsonIgnore on passwordHash and all sensitive entity fields
[ ] No sensitive data in log statements (no passwords, tokens, PII, card numbers)
[ ] Error responses via GlobalExceptionHandler — no stack traces, no internal details leaked
[ ] All config via @ConfigurationProperties — no raw Environment.getProperty() for secrets
[ ] CORS origins come from AppProperties, not hardcoded strings
[ ] OWASP dependency-check clean before merge (CVSS < 7)
[ ] SecureRandom for all security-relevant randomness (never java.util.Random)
[ ] MessageDigest.isEqual() for secret comparisons (never .equals())
```