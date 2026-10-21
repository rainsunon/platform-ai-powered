# API Authentication & Authorization — Enterprise Standard

**Applies to:** All Spring Boot APIs serving external or internal consumers.
**Stack:** `jjwt`, `spring-security-oauth2`, `BCrypt`/`Argon2id`, RBAC/ABAC patterns.

---

## SECTION 1 — AUTHENTICATION METHODS

| Method | Use when | Security level |
|--------|----------|---------------|
| JWT (Bearer token) | User-facing APIs, SPAs, mobile | High |
| API Key | Third-party integrations, webhooks | Medium |
| OAuth2 Client Credentials | Service-to-service | High |
| mTLS | Internal microservices, zero-trust | Very High |
| Session cookie | Server-rendered web apps | High (with CSRF) |

**Rule:** Never use API keys as the sole auth for user-facing endpoints. API keys are for machine clients.

---

## SECTION 2 — JWT LIFECYCLE

### Token Structure

```java
// security/Claims.java — JWT payload modelled as a record
public record TokenClaims(
    Long   userId,     // "sub"       — user identifier
    Long   tenantId,   // "tenant_id" — tenant context
    List<String> scopes, // "scopes"  — permissions
    String jti,        // "jti"       — JWT ID for revocation
    String type        // "typ"       — "access" or "refresh"
) {}
```

### Token Pair Pattern

```java
// security/JwtService.java
@Service
@RequiredArgsConstructor
public class JwtService {

    private static final Duration ACCESS_TOKEN_EXPIRE  = Duration.ofMinutes(15);
    private static final Duration REFRESH_TOKEN_EXPIRE = Duration.ofDays(7);
    private static final String   ISSUER               = "nmn";
    private static final String   CLAIM_TENANT         = "tenant_id";
    private static final String   CLAIM_SCOPES         = "scopes";
    private static final String   CLAIM_JTI            = "jti";
    private static final String   CLAIM_TYPE           = "typ";
    private static final String   TYPE_ACCESS          = "access";
    private static final String   TYPE_REFRESH         = "refresh";

    private final AppProperties props;

    /** Issues a signed access token (15 min) for the given user. */
    public String createAccessToken(Long userId, Long tenantId, List<String> scopes) {
        return buildToken(userId, tenantId, scopes, TYPE_ACCESS, ACCESS_TOKEN_EXPIRE);
    }

    /** Issues a signed refresh token (7 days) for the given user. */
    public String createRefreshToken(Long userId) {
        return buildToken(userId, null, List.of(), TYPE_REFRESH, REFRESH_TOKEN_EXPIRE);
    }

    /**
     * Parses and validates signature, expiry, issuer, and token type.
     * Throws JwtException (unchecked) if any check fails — caller maps to 401.
     */
    public TokenClaims decode(String tokenStr, String expectedType) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .requireIssuer(ISSUER)
                .build()
                .parseSignedClaims(tokenStr)
                .getPayload();

        String actualType = claims.get(CLAIM_TYPE, String.class);
        if (!expectedType.equals(actualType)) {
            throw new JwtException(
                "token type mismatch: got " + actualType + " want " + expectedType);
        }

        Long tenantId = claims.get(CLAIM_TENANT, Long.class);
        @SuppressWarnings("unchecked")
        List<String> scopes = (List<String>) claims.getOrDefault(CLAIM_SCOPES, List.of());

        return new TokenClaims(
            Long.parseLong(claims.getSubject()),
            tenantId,
            scopes,
            claims.get(CLAIM_JTI, String.class),
            actualType
        );
    }

    // ── private ──────────────────────────────────────────────────────────────

    private String buildToken(Long userId, Long tenantId,
                               List<String> scopes, String type, Duration ttl) {
        Instant now = Instant.now();
        JwtBuilder builder = Jwts.builder()
                .subject(userId.toString())
                .issuer(ISSUER)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ttl)))
                .claim(CLAIM_JTI, UUID.randomUUID().toString())
                .claim(CLAIM_TYPE, type)
                .signWith(getSigningKey(), Jwts.SIG.HS256);

        if (tenantId != null) builder.claim(CLAIM_TENANT, tenantId);
        if (!scopes.isEmpty()) builder.claim(CLAIM_SCOPES, scopes);

        return builder.compact();
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(props.jwt().secret()));
    }
}
```

### Token Refresh Flow

```
1. Client sends expired access token → 401
2. Client sends refresh token to POST /api/v1/auth/refresh
3. Server validates refresh token, issues new access + refresh pair
4. Old refresh token JTI added to Redis revocation list (rotation)
```

### Token Revocation

```java
// security/TokenRevocationService.java
@Service
@RequiredArgsConstructor
public class TokenRevocationService {

    private static final String PREFIX = "revoked:";
    private final StringRedisTemplate redisTemplate;

    /** Adds the JTI to the revocation list with a TTL matching the token's remaining life. */
    public void revoke(String jti, Duration ttl) {
        redisTemplate.opsForValue().set(PREFIX + jti, "1", ttl);
    }

    /** Returns true if the JTI has been revoked. */
    public boolean isRevoked(String jti) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(PREFIX + jti));
    }
}
```

### Auth Filter

```java
// security/JwtAuthenticationFilter.java
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService               jwtService;
    private final UserDetailsService       userDetailsService;
    private final TokenRevocationService   revocationService;

    @Override
    protected void doFilterInternal(HttpServletRequest req,
            HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(req, res);
            return;
        }

        String token = header.substring(7);
        try {
            TokenClaims claims = jwtService.decode(token, "access");

            if (revocationService.isRevoked(claims.jti())) {
                res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "token revoked");
                return;
            }

            UserDetails user = userDetailsService.loadUserByUsername(
                claims.userId().toString());

            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));

            // Store resolved claims in the request for downstream use
            req.setAttribute("userId",   claims.userId());
            req.setAttribute("tenantId", claims.tenantId());
            req.setAttribute("scopes",   claims.scopes());

            SecurityContextHolder.getContext().setAuthentication(auth);

        } catch (JwtException ex) {
            log.warn("JWT validation failed: {}", ex.getMessage());
            res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "invalid or expired token");
            return;
        }

        chain.doFilter(req, res);
    }
}
```

---

## SECTION 3 — OAUTH2 FLOWS

### Authorization Code Flow (user-facing apps)

```java
// config/OAuth2Config.java
@Configuration
public class OAuth2Config {

    /**
     * Spring Security handles the redirect, callback, and token exchange automatically
     * when spring-boot-starter-oauth2-client is on the classpath.
     * Configure in application.yml — no manual AuthCodeURL needed.
     */
    @Bean
    public SecurityFilterChain oauth2FilterChain(HttpSecurity http) throws Exception {
        return http
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/oauth2/authorization/google")
                .defaultSuccessUrl("/api/v1/auth/oauth2/success")
                .failureUrl("/login?error")
            )
            .build();
    }
}
```

```yaml
# application.yml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            redirect-uri: "${APP_BASE_URL}/login/oauth2/code/google"
            scope: openid, email, profile
        provider:
          google:
            issuer-uri: https://accounts.google.com
```

```java
// service/OAuth2UserService.java — called after successful OAuth2 callback
@Service
@RequiredArgsConstructor
public class OAuth2UserService
        extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final JwtService     jwtService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest req) {
        OAuth2User oauthUser = super.loadUser(req);
        String email = oauthUser.getAttribute("email");

        // Create or update local user, then issue our own JWT pair
        User user = userRepository.findByEmail(email)
            .orElseGet(() -> userRepository.save(
                new User(email, null, "viewer")));

        // Attach our internal user ID to the OAuth2User for downstream use
        return new DefaultOAuth2User(
            oauthUser.getAuthorities(),
            Map.of("email", email, "userId", user.getId()),
            "email"
        );
    }
}
```

**State parameter:** Spring Security generates and validates the `state` parameter automatically — no manual cookie handling needed.

### Client Credentials Flow (service-to-service)

```java
// config/ServiceClientConfig.java
@Configuration
public class ServiceClientConfig {

    /**
     * RestClient configured with OAuth2 Client Credentials.
     * Token is fetched and refreshed automatically by Spring Security.
     */
    @Bean
    public RestClient ordersServiceClient(OAuth2AuthorizedClientManager clientManager) {
        ServletOAuth2AuthorizedClientExchangeFilterFunction oauth2 =
            new ServletOAuth2AuthorizedClientExchangeFilterFunction(clientManager);
        oauth2.setDefaultClientRegistrationId("orders-service");

        return RestClient.builder()
            .baseUrl("${services.orders.base-url}")
            .requestInterceptor(oauth2)            // injects Bearer token automatically
            .build();
    }
}
```

```yaml
# application.yml
spring:
  security:
    oauth2:
      client:
        registration:
          orders-service:
            client-id: ${ORDERS_CLIENT_ID}
            client-secret: ${ORDERS_CLIENT_SECRET}
            authorization-grant-type: client_credentials
            scope: orders:read, orders:write
        provider:
          orders-service:
            token-uri: ${AUTH_SERVER_URL}/oauth/token
```

---

## SECTION 4 — RBAC (Role-Based Access Control)

```java
// authz/Role.java
public enum Role {
    VIEWER,
    EDITOR,
    ADMIN,
    SUPER_ADMIN;
}

// authz/Permission.java
public enum Permission {
    READ,
    WRITE,
    DELETE_OWN,
    DELETE_ANY,
    MANAGE_USERS,
    MANAGE_ORG;
}

// authz/RolePermissions.java
// Role hierarchy — higher roles inherit lower permissions.
@Component
public class RolePermissions {

    private static final Map<Role, Set<Permission>> HIERARCHY = Map.of(
        Role.VIEWER,     Set.of(Permission.READ),
        Role.EDITOR,     Set.of(Permission.READ, Permission.WRITE,
                                Permission.DELETE_OWN),
        Role.ADMIN,      Set.of(Permission.READ, Permission.WRITE,
                                Permission.DELETE_OWN, Permission.DELETE_ANY,
                                Permission.MANAGE_USERS),
        Role.SUPER_ADMIN, Set.of(Permission.READ, Permission.WRITE,
                                Permission.DELETE_OWN, Permission.DELETE_ANY,
                                Permission.MANAGE_USERS, Permission.MANAGE_ORG)
    );

    public boolean hasPermission(Role role, Permission permission) {
        return HIERARCHY.getOrDefault(role, Set.of()).contains(permission);
    }
}
```

```java
// Using Spring Security's @PreAuthorize — declarative, no middleware boilerplate
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) { ... }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('EDITOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<UserResponse> updateUser(...) { ... }

    @GetMapping
    @PreAuthorize("hasRole('VIEWER')")
    public ResponseEntity<Page<UserResponse>> listUsers(...) { ... }
}
```

```java
// For permission-level checks (not just roles), use a custom PermissionEvaluator:
@Component
public class AppPermissionEvaluator implements PermissionEvaluator {

    private final RolePermissions rolePermissions;

    @Override
    public boolean hasPermission(Authentication auth, Object targetDomainObject,
                                  Object permissionName) {
        Role role = extractRole(auth);
        Permission permission = Permission.valueOf(permissionName.toString().toUpperCase());
        return rolePermissions.hasPermission(role, permission);
    }

    @Override
    public boolean hasPermission(Authentication auth, Serializable targetId,
                                  String targetType, Object permissionName) {
        return hasPermission(auth, null, permissionName);
    }

    private Role extractRole(Authentication auth) {
        return auth.getAuthorities().stream()
            .map(a -> a.getAuthority().replace("ROLE_", ""))
            .map(Role::valueOf)
            .findFirst()
            .orElseThrow(() -> new ForbiddenException("No role assigned"));
    }
}

// Usage with @PreAuthorize:
@DeleteMapping("/{id}")
@PreAuthorize("hasPermission(null, 'DELETE_ANY')")
public ResponseEntity<Void> deleteUser(@PathVariable Long id) { ... }
```

---

## SECTION 5 — ABAC (Attribute-Based Access Control)

For complex authorization beyond roles:

```java
// authz/AccessContext.java
public record AccessContext(
    Long   userId,
    Role   userRole,
    Long   userOrgId,
    Long   resourceOwnerId,
    Long   resourceOrgId,
    String action           // "read", "create", "update", "delete"
) {}

// authz/AccessPolicy.java
@Component
public class AccessPolicy {

    /**
     * Evaluates whether the given context satisfies the access policy.
     */
    public boolean evaluate(AccessContext ctx) {
        // Super admin can do anything
        if (ctx.userRole() == Role.SUPER_ADMIN) return true;

        // Cross-org access is always denied
        if (!ctx.userOrgId().equals(ctx.resourceOrgId())) return false;

        // Owner can update or delete their own resource
        if ((ctx.action().equals("update") || ctx.action().equals("delete"))
                && ctx.userId().equals(ctx.resourceOwnerId())) return true;

        // Admin can do anything within their org
        if (ctx.userRole() == Role.ADMIN) return true;

        // Editor can read and create
        if (ctx.userRole() == Role.EDITOR
                && (ctx.action().equals("read") || ctx.action().equals("create")))
            return true;

        return false;
    }
}
```

```java
// Usage in service layer — not the controller
@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final AccessPolicy     accessPolicy;
    private final DocumentRepository repo;

    @Override
    public void deleteDocument(Long docId, Long requestingUserId, Role requestingRole,
                                Long requestingOrgId) {
        Document doc = repo.findById(docId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + docId));

        AccessContext ctx = new AccessContext(
            requestingUserId, requestingRole, requestingOrgId,
            doc.getOwnerId(), doc.getOrgId(), "delete"
        );

        if (!accessPolicy.evaluate(ctx))
            throw new ForbiddenException("Insufficient permissions to delete this document");

        repo.delete(doc);
    }
}
```

For richer policies (policy-as-code), evaluate **OPA (Open Policy Agent)** via its REST API
or **Casbin** (`casbin-spring-boot-starter`).

---

## SECTION 6 — API KEY MANAGEMENT

```java
// security/ApiKeyService.java
@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private static final String PREFIX = "sk_";

    /**
     * Generates a new API key pair.
     * Returns (rawKey, sha256HexHash). Store the hash; show the raw key once.
     */
    public ApiKeyPair generate() throws NoSuchAlgorithmException {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);

        String raw = PREFIX + HexFormat.of().formatHex(bytes);  // e.g. sk_a3f9...
        String hash = sha256Hex(raw);

        return new ApiKeyPair(raw, hash);
    }

    /**
     * Verifies a presented raw key against a stored sha256 hex hash.
     * Comparison is constant-time.
     */
    public boolean verify(String rawKey, String storedHashHex) {
        try {
            String presented = sha256Hex(rawKey);
            return MessageDigest.isEqual(
                presented.getBytes(StandardCharsets.UTF_8),
                storedHashHex.getBytes(StandardCharsets.UTF_8)
            );
        } catch (NoSuchAlgorithmException ex) {
            return false;
        }
    }

    private String sha256Hex(String input) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }

    public record ApiKeyPair(String rawKey, String hashHex) {}
}
```

```java
// security/ApiKeyAuthFilter.java — extract and validate API key from header
@Component
@RequiredArgsConstructor
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private final ApiKeyRepository apiKeyRepository;
    private final ApiKeyService    apiKeyService;

    @Override
    protected void doFilterInternal(HttpServletRequest req,
            HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String rawKey = req.getHeader("X-API-Key");
        if (rawKey == null) {
            chain.doFilter(req, res);
            return;
        }

        apiKeyRepository.findByKeyPrefix(rawKey.substring(0, 10))
            .filter(storedKey -> !storedKey.isExpired())
            .filter(storedKey -> apiKeyService.verify(rawKey, storedKey.getHashHex()))
            .ifPresentOrElse(
                storedKey -> {
                    req.setAttribute("clientId", storedKey.getClientId());
                    SecurityContextHolder.getContext().setAuthentication(
                        new ApiKeyAuthenticationToken(storedKey));
                },
                () -> {
                    try { res.sendError(HttpStatus.UNAUTHORIZED.value(), "invalid API key"); }
                    catch (IOException ignored) {}
                }
            );

        chain.doFilter(req, res);
    }
}
```

### API Key Rules

- Prefix keys for identification: `sk_live_`, `sk_test_`, `pk_`.
- Hash before storing — never store raw keys in DB.
- Support key rotation: allow multiple active keys per client.
- Set expiry dates — no permanent keys.
- Rate-limit per key, not just per IP.
- Log key usage (key prefix only, never the full key) for audit trail.

---

## SECTION 7 — SERVICE-TO-SERVICE AUTH

### Option A: Signed JWTs (lightweight)

```java
// Each service has its own RSA key pair.
// Service A signs requests with its private key.
// Service B verifies with A's public key from JWKS endpoint or static config.

// config/ServiceJwtConfig.java
@Configuration
public class ServiceJwtConfig {

    @Bean
    public JWKSource<SecurityContext> jwkSource(
            @Value("${app.service-auth.private-key-path}") String keyPath) throws Exception {
        RSAKey rsaKey = RSAKey.parseFromPEMEncodedObjects(
            Files.readString(Path.of(keyPath)));
        return new ImmutableJWKSet<>(new JWKSet(rsaKey));
    }

    @Bean
    public JwtEncoder serviceJwtEncoder(JWKSource<SecurityContext> jwkSource) {
        return new NimbusJwtEncoder(jwkSource);
    }
}
```

### Option B: mTLS (zero-trust)

```yaml
# Service mesh (Istio/Linkerd) — no application code changes needed.
# Spring Boot TLS config for standalone mTLS (without mesh):
server:
  ssl:
    enabled: true
    client-auth: need
    key-store: ${SSL_KEYSTORE_PATH}
    key-store-password: ${SSL_KEYSTORE_PASSWORD}
    trust-store: ${SSL_TRUSTSTORE_PATH}
    trust-store-password: ${SSL_TRUSTSTORE_PASSWORD}
```

```yaml
# Istio PeerAuthentication — enforces mTLS across the mesh
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT
```

### Rules

- Internal services MUST authenticate each other — no "trusted network" assumption.
- Propagate correlation IDs and user context via headers: `X-Request-ID`, `X-User-ID`, `X-Tenant-ID`.
- Use short-lived tokens (≤5 min) for all service-to-service calls.
- Rotate service credentials automatically via Vault or AWS Secrets Manager.
- Always set `RestClient` / `WebClient` timeouts on inter-service calls — see `skills/common/microservices.md` §5.
