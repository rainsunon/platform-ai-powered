# Database Design — Enterprise Standard

**Applies to:** All Java Spring Boot projects using a relational database.
**Drivers:** Spring Data JPA + Hibernate (preferred), Spring JDBC Template (lightweight queries).
**Query layers:** Spring Data JPA repositories (preferred), JPQL, native SQL, QueryDSL.
**Migration tools:** Flyway (preferred), Liquibase.

---

## SECTION 1 — DB ACCESS LIBRARY CHOICE

| Layer | Recommendation | When |
|---|---|---|
| ORM | Spring Data JPA + Hibernate | Default for all new services |
| Query builder | QueryDSL | Complex dynamic queries; type-safe predicates |
| Raw SQL | `JdbcTemplate` / `NamedParameterJdbcTemplate` | Bulk ops, reporting queries, stored procedures |
| Connection pool | HikariCP (Spring Boot default) | Always — never create raw `Connection` per-request |
| Migration | Flyway | Schema versioning; runs automatically on startup |

**Why Spring Data JPA:** Repository interfaces (`JpaRepository`) eliminate CRUD boilerplate. JPQL stays close to SQL. Hibernate generates safe parameterised queries — no injection risk.

**Why not raw JDBC for everything:** Verbose `ResultSet.get*` boilerplate; manual mapping; no transaction management integration. Use `JdbcTemplate` only for bulk operations or queries that need native SQL optimisations.

---

## SECTION 2 — ENTITY FOUNDATION

### 2.1 Base Entity — Audit Fields

Create a `BaseEntity` that all entities extend — centralises audit fields in one place so every entity inherits them automatically.

```java
// src/main/java/com/nmn/app/model/BaseEntity.java
package com.nmn.app.model;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Getters — no setters for audit fields; managed by Spring Data Auditing
    public Long getId() { return id; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
```

Enable Spring Data Auditing in your main config:

```java
// src/main/java/com/nmn/app/config/JpaConfig.java
package com.nmn.app.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing
public class JpaConfig {}
```

### 2.2 Domain Entity — User Example

```java
// src/main/java/com/nmn/app/model/User.java
package com.nmn.app.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "users",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_users_email_tenant", columnNames = {"email", "tenant_id"})
    },
    indexes = {
        @Index(name = "ix_users_public_id",     columnList = "public_id"),
        @Index(name = "ix_users_tenant_id",     columnList = "tenant_id"),
        @Index(name = "ix_users_tenant_active", columnList = "tenant_id, is_active")
    }
)
@SQLRestriction("deleted_at IS NULL")   // global soft-delete filter — automatically appended to all queries on this entity
public class User extends BaseEntity {

    @Column(name = "public_id", nullable = false, updatable = false, unique = true)
    private UUID publicId = UUID.randomUUID();

    @Email
    @NotBlank
    @Size(max = 254)
    @Column(name = "email", nullable = false, length = 254)
    private String email;

    @NotBlank
    @Size(max = 100)
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "password_hash", nullable = false, length = 128)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role = Role.VIEWER;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_users_tenant_id_tenants"))
    private Tenant tenant;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    // Soft delete — sets deletedAt; @SQLRestriction excludes from all queries automatically
    public void softDelete() {
        this.deletedAt = Instant.now();
        this.active = false;
    }

    // Domain invariant — enforced before every insert and update
    @PrePersist
    @PreUpdate
    public void validate() {
        if (email == null || email.isBlank()) throw new IllegalStateException("email is required");
        if (tenant == null) throw new IllegalStateException("tenant is required");
    }

    // Getters and setters omitted for brevity — use Lombok @Getter @Setter in real code
}
```

```java
// src/main/java/com/nmn/app/model/Role.java
package com.nmn.app.model;

public enum Role {
    VIEWER, EDITOR, ADMIN, SUPER_ADMIN
}
```

**Important:** JSON serialisation tags go on DTOs in `com.nmn.app.api.dto`, not on entities — entities are a persistence concern, DTOs are an API concern.

---

## SECTION 3 — NAMING CONVENTIONS

| Element | Convention | Example |
|---|---|---|
| Table name | `snake_case`, plural | `user_orders`, `product_categories` |
| Column name | `snake_case` | `created_at`, `is_active`, `tenant_id` |
| Primary key | Always `id`, `BIGSERIAL` / `IDENTITY` | `id BIGINT PRIMARY KEY` |
| Foreign key column | `{singular_table}_id` | `user_id`, `order_id` |
| Boolean columns | `is_` or `has_` prefix | `is_active`, `has_verified_email` |
| Timestamp columns | `_at` suffix, `TIMESTAMPTZ` | `created_at`, `deleted_at` |
| Hashed / encrypted | `_hash` / `_encrypted` suffix | `password_hash`, `ssn_encrypted` |
| Index | `ix_{table}_{columns}` | `ix_users_email` |
| Unique constraint | `uq_{table}_{columns}` | `uq_users_email_tenant` |
| Foreign key constraint | `fk_{table}_{col}_{ref_table}` | `fk_orders_user_id_users` |
| Check constraint | `ck_{table}_{rule}` | `ck_orders_amount_positive` |
| Java entity class | `PascalCase`, singular | `UserOrder`, `ProductCategory` |
| Java field | `camelCase` | `createdAt`, `isActive`, `tenantId` |

---

## SECTION 4 — REPOSITORY PATTERN

```java
// src/main/java/com/nmn/app/repository/UserRepository.java
package com.nmn.app.repository;

import com.nmn.app.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, Long> {

    // Spring Data derives the query from the method name — no SQL needed
    Optional<User> findByPublicId(UUID publicId);

    Optional<User> findByEmailAndTenant_Id(String email, Long tenantId);

    // JPQL — parameterised, injection-safe
    @Query("SELECT u FROM User u WHERE u.tenant.id = :tenantId AND u.active = true")
    Page<User> findActiveByTenantId(@Param("tenantId") Long tenantId, Pageable pageable);

    boolean existsByEmailAndTenant_Id(String email, Long tenantId);

    // Soft delete — sets deleted_at via JPQL update (bypasses @SQLRestriction)
    @Modifying
    @Query("UPDATE User u SET u.deletedAt = CURRENT_TIMESTAMP, u.active = false WHERE u.id = :id")
    int softDeleteById(@Param("id") Long id);
}
```

**Custom repository for complex queries:**

```java
// src/main/java/com/nmn/app/repository/UserRepositoryCustom.java
package com.nmn.app.repository;

import com.nmn.app.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserRepositoryCustom {
    Page<User> searchUsers(Long tenantId, String emailLike, String role, Pageable pageable);
}
```

```java
// src/main/java/com/nmn/app/repository/UserRepositoryImpl.java
package com.nmn.app.repository;

import com.nmn.app.model.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class UserRepositoryImpl implements UserRepositoryCustom {

    @PersistenceContext
    private EntityManager em;

    @Override
    public Page<User> searchUsers(Long tenantId, String emailLike, String role, Pageable pageable) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<User> cq = cb.createQuery(User.class);
        Root<User> root = cq.from(User.class);

        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.equal(root.get("tenant").get("id"), tenantId));
        if (emailLike != null) predicates.add(cb.like(cb.lower(root.get("email")), "%" + emailLike.toLowerCase() + "%"));
        if (role != null) predicates.add(cb.equal(root.get("role").as(String.class), role));

        cq.where(predicates.toArray(new Predicate[0]))
          .orderBy(cb.desc(root.get("createdAt")));

        List<User> results = em.createQuery(cq)
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize())
                .getResultList();

        // Count query
        CriteriaQuery<Long> countCq = cb.createQuery(Long.class);
        Root<User> countRoot = countCq.from(User.class);
        countCq.select(cb.count(countRoot)).where(predicates.toArray(new Predicate[0]));
        long total = em.createQuery(countCq).getSingleResult();

        return new PageImpl<>(results, pageable, total);
    }
}
```

---

## SECTION 5 — TRANSACTIONS

Spring's `@Transactional` is the manages the full transaction lifecycle via AOP proxy — it handles begin, commit, and rollback automatically.

```java
// src/main/java/com/nmn/app/service/OrderService.java
package com.nmn.app.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;

    public OrderService(OrderRepository orderRepository, InventoryRepository inventoryRepository) {
        this.orderRepository = orderRepository;
        this.inventoryRepository = inventoryRepository;
    }

    // READ_COMMITTED — prevents dirty reads; suitable default for most write operations
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Order placeOrder(CreateOrderRequest request) {
        // Any unchecked exception → automatic rollback
        // Any checked exception → commit unless rollbackFor is set
        Inventory inventory = inventoryRepository.findByProductIdWithLock(request.productId())
                .orElseThrow(() -> new ProductNotFoundException(request.productId()));

        inventory.reserve(request.quantity());          // throws if insufficient stock → rollback
        inventoryRepository.save(inventory);

        Order order = Order.create(request);
        return orderRepository.save(order);
    }

    // Read-only — Hibernate skips dirty-checking; DB may route to replica
    @Transactional(readOnly = true)
    public Page<Order> listOrders(Long tenantId, Pageable pageable) {
        return orderRepository.findByTenantId(tenantId, pageable);
    }

    // Explicit rollback for checked exceptions
    @Transactional(rollbackFor = Exception.class)
    public void processPayment(Long orderId) throws PaymentException {
        // ...
    }
}
```

**Rules:**
- `@Transactional` goes on **service layer** methods, never on repository or controller.
- Default propagation is `REQUIRED` — joins an existing transaction if one exists.
- `readOnly = true` on all read operations — lets Hibernate skip dirty-checking and allows DB read replicas.
- Rollback happens automatically for `RuntimeException`; add `rollbackFor = Exception.class` for checked exceptions.
- Never call a `@Transactional` method from within the same class (Spring proxy won't intercept it).

---

## SECTION 6 — QUERY PATTERNS

### 6.1 Always use parameterised queries — never string concatenation

```java
// ✅ CORRECT — Spring Data derived query (parameterised automatically)
userRepository.findByEmailAndTenant_Id(email, tenantId);

// ✅ CORRECT — JPQL named parameter
@Query("SELECT u FROM User u WHERE u.email = :email AND u.tenant.id = :tenantId")
Optional<User> findByEmailAndTenant(@Param("email") String email, @Param("tenantId") Long tenantId);

// ✅ CORRECT — JdbcTemplate (named parameters)
namedJdbcTemplate.queryForObject(
    "SELECT id FROM users WHERE email = :email AND tenant_id = :tenantId",
    Map.of("email", email, "tenantId", tenantId),
    Long.class
);

// ❌ WRONG — string concatenation: SQL injection
String q = "SELECT * FROM users WHERE email = '" + email + "'";
em.createNativeQuery(q).getResultList();
```

### 6.2 N+1 prevention

```java
// ❌ N+1 — one query per order to fetch user
List<Order> orders = orderRepository.findAll();
for (Order order : orders) {
    User user = order.getUser();    // lazy load fires per iteration
    process(order, user);
}

// ✅ CORRECT — JOIN FETCH in JPQL (single query)
@Query("SELECT o FROM Order o JOIN FETCH o.user WHERE o.status = :status")
List<Order> findByStatusWithUser(@Param("status") OrderStatus status);

// ✅ CORRECT — @EntityGraph (declarative fetch strategy)
@EntityGraph(attributePaths = {"user", "items"})
List<Order> findByTenantId(Long tenantId);

// ✅ CORRECT — batch fetch for IN clause
@Query("SELECT u FROM User u WHERE u.id IN :ids")
List<User> findAllByIds(@Param("ids") List<Long> ids);
```

Configure global batch size in `application.yml` to prevent N+1 on collections:

```yaml
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 25   # fetch up to 25 related entities per query
```

### 6.3 Pagination — always required for list queries

```java
// Offset pagination — Spring Data Page (simple; slow on large offsets)
@Transactional(readOnly = true)
public Page<UserDto> listUsers(Long tenantId, int page, int size) {
    if (size < 1 || size > 100) throw new ValidationException("page_size must be 1..100");
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    return userRepository.findActiveByTenantId(tenantId, pageable)
            .map(userMapper::toDto);
}
```

```java
// Cursor pagination — preferred for large datasets
// Cursor = (createdAt, id) compound key
@Query("""
    SELECT u FROM User u
    WHERE u.tenant.id = :tenantId
      AND (u.createdAt < :cursorTs OR (u.createdAt = :cursorTs AND u.id < :cursorId))
    ORDER BY u.createdAt DESC, u.id DESC
    LIMIT :size
    """)
List<User> findPageByCursor(
    @Param("tenantId") Long tenantId,
    @Param("cursorTs") Instant cursorTs,
    @Param("cursorId") Long cursorId,
    @Param("size") int size
);
```

---

## SECTION 7 — DECIMAL HANDLING FOR MONETARY VALUES

```java
// ❌ NEVER use double or float for money — IEEE 754 loses precision
double price = 0.1 + 0.2;   // 0.30000000000000004 — WRONG

// ✅ ALWAYS use BigDecimal — backed by NUMERIC(precision, scale) in Postgres
import java.math.BigDecimal;
import java.math.RoundingMode;

@Entity
public class Product extends BaseEntity {

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;   // maps to NUMERIC(10, 2) — exact decimal storage
}

// Arithmetic — always set scale and rounding mode explicitly
public BigDecimal calculateTotal(BigDecimal price, int quantity, BigDecimal taxRate) {
    BigDecimal subtotal = price.multiply(BigDecimal.valueOf(quantity));
    BigDecimal tax = subtotal.multiply(taxRate);
    return subtotal.add(tax).setScale(2, RoundingMode.HALF_UP);
}

// Comparison — never use == or !=; use compareTo
if (price.compareTo(BigDecimal.ZERO) <= 0) {
    throw new ValidationException("price must be positive");
}
```

Database column type: `NUMERIC(precision, scale)` — exact decimal storage, with no floating-point rounding errors.

---

## SECTION 8 — INDEXING STRATEGY

### 8.1 Always index

- All foreign key columns (Postgres does NOT auto-index FK columns — declare `@Index` explicitly).
- Columns in `WHERE` clauses of high-frequency queries.
- Columns in `JOIN` conditions.
- Columns in `ORDER BY` on large tables.
- `deleted_at IS NULL` — partial index on active rows (via Flyway migration, not JPA annotation).
- Any column with a `UNIQUE` constraint (implicit index).

### 8.2 Never index

- Boolean columns alone — low cardinality.
- Very-high-write/low-read columns.
- "Just in case" — each index slows `INSERT`/`UPDATE`/`DELETE`.
- Tables with fewer than ~1000 rows — sequential scan is faster.

### 8.3 Declare indexes via Flyway, not JPA annotations

JPA `@Index` works but gives you no control over partial indexes, `CONCURRENTLY`, or expression indexes. Declare in migration SQL:

```sql
-- V2__add_user_indexes.sql

-- Composite index — most-selective column first
CREATE INDEX ix_orders_user_created ON orders (user_id, created_at);

-- Partial index — only pending orders
CREATE INDEX ix_orders_pending ON orders (created_at) WHERE status = 'pending';

-- Concurrent — does not lock the table
CREATE INDEX CONCURRENTLY ix_users_email_lower ON users (LOWER(email));

-- GIN for JSONB
CREATE INDEX ix_orders_metadata ON orders USING GIN (metadata);
```

### 8.4 JPA-level index declarations (for simple indexes only)

```java
@Table(
    name = "users",
    indexes = {
        @Index(name = "ix_users_public_id",  columnList = "public_id"),
        @Index(name = "ix_users_tenant_id",  columnList = "tenant_id"),
        @Index(name = "ix_users_email",      columnList = "email")
    }
)
```

**Rule:** Flyway owns the schema — do not use `spring.jpa.hibernate.ddl-auto=create` or `update` in any environment above local dev. Set it to `validate` in production.

---

## SECTION 9 — CONNECTION POOL TUNING (HikariCP)

```yaml
# src/main/resources/application.yml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
    hikari:
      maximum-pool-size: 25           # ~ (cores × 2) + spindle_count; tune via pgbouncer
      minimum-idle: 2
      connection-timeout: 30000       # ms — max wait to acquire connection from pool
      idle-timeout: 300000            # ms — 5 min; close idle connections
      max-lifetime: 1800000           # ms — 30 min; rotate to pick up DNS / failover changes
      keepalive-time: 60000           # ms — heartbeat to keep connections alive through firewalls
      validation-timeout: 5000        # ms — max time to validate a connection
      connection-test-query: SELECT 1  # fallback if JDBC driver doesn't support isValid()

  jpa:
    hibernate:
      ddl-auto: validate              # NEVER create/update in production
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        jdbc:
          time_zone: UTC
        default_batch_fetch_size: 25
```

**Rules:**
- Never call `dataSource.getConnection()` manually — always let Spring / HikariCP manage the pool.
- Never close a `Connection` obtained from `@Transactional` context — Spring closes it after the transaction.
- `max-lifetime` must be less than Postgres `idle_in_transaction_session_timeout` and any load balancer idle timeout.
- Monitor `hikaricp.connections.pending` — if it grows, increase `maximum-pool-size` or add a read replica.

---

## SECTION 10 — FLYWAY MIGRATIONS

```
src/main/resources/db/migration/
├── V1__create_tenants.sql
├── V2__create_users.sql
├── V3__add_user_indexes.sql
└── V4__add_orders.sql
```

```yaml
# application.yml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: false      # true only when adding Flyway to an existing DB
    out-of-order: false             # enforce strict version ordering in CI
    validate-on-migrate: true       # fail fast if checksums don't match
```

```sql
-- V2__create_users.sql
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    public_id     UUID NOT NULL DEFAULT gen_random_uuid(),
    email         VARCHAR(254) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'VIEWER',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    tenant_id     BIGINT       NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ,
    CONSTRAINT uq_users_email_tenant  UNIQUE  (email, tenant_id),
    CONSTRAINT ck_users_role          CHECK   (role IN ('VIEWER', 'EDITOR', 'ADMIN', 'SUPER_ADMIN')),
    CONSTRAINT fk_users_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indexes
CREATE INDEX ix_users_public_id     ON users (public_id);
CREATE INDEX ix_users_tenant_id     ON users (tenant_id);
CREATE INDEX ix_users_tenant_active ON users (tenant_id, is_active) WHERE is_active = TRUE;
CREATE INDEX ix_users_active        ON users (id) WHERE deleted_at IS NULL;
```

**Flyway rules:**
- Never modify a committed migration file — create a new version instead.
- Always test migrations against a production-size dataset before deploying.
- Use `CONCURRENTLY` for index creation on large live tables (requires a separate migration; cannot run inside a transaction).
- Flyway runs automatically on Spring Boot startup — no manual step needed in CI/CD.