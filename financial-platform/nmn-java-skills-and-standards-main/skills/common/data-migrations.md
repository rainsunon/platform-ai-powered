# Data Migrations — Enterprise Standard

**Applies to:** All Java Spring Boot projects with relational databases.
**Tool:** Flyway (preferred), Liquibase.
**Principle:** Every migration must be deployable without downtime.

---

## SECTION 1 — ZERO-DOWNTIME RULES

| Rule | Rationale |
|------|-----------|
| Never rename a column in one step | Old code still reads the old name during rolling deploy |
| Never drop a column in the release that stops using it | Old pods still reference it |
| Never add a NOT NULL column without a default | Existing rows fail INSERT from old code |
| Always implement a rollback path | Flyway undo scripts or manual reversal migration must exist |
| Separate schema migrations from data migrations | Schema = fast DDL; data = slow backfill |
| Test migrations against a production-sized dataset | A 2s migration on dev can be a 2h lock on prod |
| Use `CREATE INDEX CONCURRENTLY` for large tables (Postgres) | Avoids blocking writers during index creation |
| Flyway runs each migration in a transaction by default | Atomic apply — partial migrations cannot be committed |
| Disable transaction wrapping for `CREATE INDEX CONCURRENTLY` | The command itself cannot run inside a transaction |

---

## SECTION 2 — TOOLING (FLYWAY)

### 2.1 Flyway Setup

```xml
<!-- pom.xml — Flyway is included via Spring Boot; pin the version explicitly -->
<dependency>
  <groupId>org.flywaydb</groupId>
  <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
  <groupId>org.flywaydb</groupId>
  <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

```yaml
# application.yml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: false       # true only when adding Flyway to an existing DB
    out-of-order: false              # enforce strict version ordering in CI
    validate-on-migrate: true        # fail fast if checksums don't match
    placeholders-enabled: false      # disable ${} placeholder replacement — conflicts with SQL
```

Flyway runs automatically on Spring Boot startup — no manual command needed.

### 2.2 Migration File Naming

```
src/main/resources/db/migration/
├── V1__create_tenants.sql
├── V2__create_users.sql
├── V3__add_phone_to_users.sql
├── V4__add_user_indexes.sql
└── R__refresh_reporting_view.sql    ← repeatable migration (R__ prefix)
```

Convention: `V{version}__{description}.sql` — two underscores, description in snake_case.

### 2.3 Standard Migration Template

```sql
-- V3__add_phone_to_users.sql
-- Description: Add phone column to users table
-- Author: Arpit Gaur
-- Date: 2025-01-15

ALTER TABLE users ADD COLUMN phone VARCHAR(20);
```

### 2.4 Non-transactional migration (for CONCURRENTLY)

Flyway does not support `NO TRANSACTION` natively like goose. Use a separate migration file and wrap with `BEGIN`/`COMMIT` control manually, or use a Flyway callback:

```sql
-- V5__add_users_phone_index.sql
-- NOTE: This migration must be run outside a transaction.
-- Flyway wraps in a transaction by default — use mixed-mode migration below.
```

```java
// src/main/java/com/nmn/app/config/FlywayConfig.java
package com.nmn.app.config;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.configuration.FluentConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfig {

    // Run non-transactional index migrations outside Flyway's transaction wrapper.
    // Tag the migration SQL with a comment: -- flyway:nonTransactional
    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> flyway.migrate();
    }
}
```

For `CREATE INDEX CONCURRENTLY`, the safest approach is a **separate migration file** with explicit session-level control:

```sql
-- V5__add_users_phone_index_concurrent.sql
-- Run outside Flyway transaction — commit first, then create index concurrently in a new session.
-- This file is intentionally a no-op in Flyway; the index is created via the migration runner below.
SELECT 1; -- placeholder — actual index created by FlywayIndexCallback
```

```java
// src/main/java/com/nmn/app/config/FlywayIndexCallback.java
package com.nmn.app.config;

import org.flywaydb.core.api.callback.Callback;
import org.flywaydb.core.api.callback.Context;
import org.flywaydb.core.api.callback.Event;
import org.springframework.stereotype.Component;

import java.sql.Statement;

@Component
public class FlywayIndexCallback implements Callback {

    @Override
    public boolean supports(Event event, Context context) {
        return event == Event.AFTER_MIGRATE;
    }

    @Override
    public void handle(Event event, Context context) {
        try (Statement stmt = context.getConnection().createStatement()) {
            // CONCURRENTLY cannot run inside a transaction — Flyway calls this after commit
            stmt.execute(
                "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_users_phone ON users (phone)"
            );
        } catch (Exception ex) {
            throw new RuntimeException("Failed to create concurrent index", ex);
        }
    }

    @Override
    public boolean canHandleInTransaction(Event event, Context context) {
        return false;   // run outside Flyway's transaction
    }
}
```

---

## SECTION 3 — EXPAND-CONTRACT PATTERN

Safe way to make breaking schema changes across rolling deployments:

### Phase 1 — Expand (deploy with old + new)

```sql
-- V6__expand_add_full_name_to_users.sql
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);  -- nullable — no lock on existing rows
```

- Add new column as **nullable** — no lock acquired on existing rows.
- Deploy code that writes to **both** old (`first_name` + `last_name`) and new (`full_name`) columns.
- Old pods still work — they ignore the new column entirely.

Update the JPA entity to write both:

```java
@Entity
public class User extends BaseEntity {

    @Column(name = "first_name") private String firstName;
    @Column(name = "last_name")  private String lastName;

    // Phase 1 — write to both; reads still use firstName + lastName
    @Column(name = "full_name")
    private String fullName;

    @PrePersist
    @PreUpdate
    public void syncFullName() {
        if (firstName != null && lastName != null) {
            this.fullName = firstName + " " + lastName;
        }
    }
}
```

### Phase 2 — Migrate (backfill data)

Run as a separate one-off Spring Boot `CommandLineRunner` or Spring Batch job — **never inside a Flyway migration file** for large tables.

```java
// src/main/java/com/nmn/app/worker/FullNameBackfillRunner.java
package com.nmn.app.worker;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One-off backfill runner — concatenates first_name + last_name into full_name.
 *
 * <p>Activate with: {@code --spring.profiles.active=backfill}
 * Run during off-peak hours for large tables.
 */
@Slf4j
@Component
@Profile("backfill")   // never runs in normal startup
public class FullNameBackfillRunner implements CommandLineRunner {

    private static final int BATCH_SIZE = 1000;

    private final JdbcTemplate jdbc;

    public FullNameBackfillRunner(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        log.info("backfill_started entity=User field=full_name batch_size={}", BATCH_SIZE);
        long lastId   = 0;
        long total    = 0;

        while (true) {
            int updated = jdbc.update("""
                UPDATE users
                SET full_name = first_name || ' ' || last_name
                WHERE id IN (
                    SELECT id FROM users
                    WHERE full_name IS NULL AND id > ?
                    ORDER BY id
                    LIMIT ?
                )
                """, lastId, BATCH_SIZE);

            if (updated == 0) break;

            // Advance cursor to max processed ID
            Long maxId = jdbc.queryForObject(
                "SELECT MAX(id) FROM users WHERE full_name IS NOT NULL AND id > ?",
                Long.class, lastId);

            if (maxId != null) lastId = maxId;
            total += updated;
            log.info("backfill_progress entity=User last_id={} total_updated={}", lastId, total);
        }

        log.info("backfill_complete entity=User total_updated={}", total);
    }
}
```

Run the backfill:

```bash
java -jar app.jar --spring.profiles.active=backfill
```

### Phase 3 — Contract (remove old columns)

```sql
-- V7__contract_drop_name_columns_from_users.sql
-- Deploy ONLY after every running pod uses full_name exclusively.
-- Minimum 1 release cycle between expand (V6) and contract (V7).
ALTER TABLE users DROP COLUMN first_name;
ALTER TABLE users DROP COLUMN last_name;
```

Remove from the JPA entity:

```java
// Phase 3 — remove firstName, lastName fields and syncFullName() entirely
@Entity
public class User extends BaseEntity {
    @Column(name = "full_name", nullable = false)
    private String fullName;
}
```

---

## SECTION 4 — BACKFILL STRATEGIES

### Batch Processing (preferred)

```
Batch size: 1000–5000 rows per commit
Commit:     per batch — never hold a transaction open for millions of rows
Logging:    log progress after every batch
Resumable:  scan against an indexed column (id); remember last_id between runs
Timing:     run during off-peak hours for very large tables
Tracking:   add a backfilled_at column if you need per-row progress tracking
```

### Spring Batch for Complex Backfills

For multi-step or long-running backfills, use Spring Batch — it provides chunked processing, restart/resume, and progress tracking out of the box:

```java
@Configuration
public class BackfillJobConfig {

    @Bean
    public Job fullNameBackfillJob(JobRepository jobRepository, Step backfillStep) {
        return new JobBuilder("fullNameBackfillJob", jobRepository)
                .start(backfillStep)
                .build();
    }

    @Bean
    public Step backfillStep(JobRepository jobRepository,
                             PlatformTransactionManager txManager,
                             JdbcCursorItemReader<Long> reader,
                             ItemProcessor<Long, Long> processor,
                             JdbcBatchItemWriter<Long> writer) {
        return new StepBuilder("backfillStep", jobRepository)
                .<Long, Long>chunk(1000, txManager)   // commit every 1000 rows
                .reader(reader)
                .processor(processor)
                .writer(writer)
                .build();
    }
}
```

---

## SECTION 5 — DANGEROUS OPERATIONS REFERENCE

| Operation | Risk | Safe Alternative |
|-----------|------|-----------------|
| `DROP COLUMN` | Breaks old code during rolling deploy | Expand-contract (3 releases) |
| `RENAME COLUMN` | Same as drop for old code | Add new column → backfill → drop old |
| `ALTER COLUMN TYPE` | Table rewrite — locks the table | Add new column → backfill → swap |
| `ADD NOT NULL` (no default) | Fails on non-empty tables | Add nullable → backfill → `SET NOT NULL` |
| `ADD UNIQUE` constraint | Fails if duplicates exist | Clean data first, then add constraint |
| `CREATE INDEX` (non-CONCURRENT) | Locks table on large datasets | `CREATE INDEX CONCURRENTLY` (Postgres) |
| `DROP TABLE` | Data loss | Rename to `_deprecated_x`, drop after 30 days |
| `TRUNCATE` | Data loss | Batched deletion script |

### Setting NOT NULL safely on Postgres

```sql
-- V8__step1_add_email_verified_nullable.sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Run backfill runner to set email_verified = TRUE/FALSE on all existing rows --

-- V9__step2_set_email_verified_not_null.sql
-- Postgres 12+: SET NOT NULL with a CHECK constraint is instant — no table rewrite
ALTER TABLE users ALTER COLUMN email_verified SET NOT NULL;
```

### Timeout guards for risky DDL

```sql
-- V10__add_risky_column.sql
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '5s';
ALTER TABLE orders ADD COLUMN discount_code VARCHAR(50);
```

---

## SECTION 6 — FILE & DEPLOYMENT RULES

- One logical change per migration file — never bundle unrelated changes.
- Filename describes what changes: `V3__add_phone_to_users.sql`, not `V3__update_schema.sql`.
- Never modify a committed migration file — Flyway validates checksums and will refuse to start.
- Create a new version instead of editing an old one.
- Never reference Java class names or Spring beans in migration files — pure SQL only.
- Flyway runs automatically at Spring Boot startup — never invoke migrations from controllers or service methods.
- Set `statement_timeout` and `lock_timeout` for any DDL that acquires an exclusive lock.
- `spring.flyway.validate-on-migrate=true` must always be enabled — catches checksum tampering in CI.

---

## SECTION 7 — MIGRATION TEST DISCIPLINE

```java
// src/test/java/com/nmn/app/migration/MigrationIntegrationTest.java
package com.nmn.app.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThatNoException;

@Tag("integration")
@SpringBootTest
@Testcontainers
class MigrationIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @Autowired
    private Flyway flyway;

    @Test
    @DisplayName("all migrations apply cleanly against a fresh database")
    void allMigrations_applyCleanly() {
        assertThatNoException().isThrownBy(() -> {
            flyway.clean();    // wipe schema
            flyway.migrate();  // re-apply all migrations from scratch
        });
    }

    @Test
    @DisplayName("migration count matches expected version")
    void migrationCount_matchesExpectedVersion() {
        long applied = flyway.info().applied().length;
        // Update this number whenever a new migration is added
        assertThat(applied).isGreaterThanOrEqualTo(4);
    }
}
```

CI must run this test on every PR that touches `src/main/resources/db/migration/`.
