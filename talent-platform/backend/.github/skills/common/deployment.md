# Deployment — Enterprise Standard

**Applies to:** All Java Spring Boot projects deployed as containers or services.
**Philosophy:** 12-factor app. Immutable artifacts. Infrastructure as code.

---

## SECTION 1 — DOCKERFILE (Multi-Stage, Distroless)

```dockerfile
# syntax=docker/dockerfile:1.7

# ── Build stage ──────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /src

# Cache Maven dependencies first
COPY pom.xml ./
RUN --mount=type=cache,target=/root/.m2 \
    mvn dependency:go-offline -B

COPY src ./src

ARG VERSION=dev
ARG COMMIT=unknown
ARG BUILD_DATE=unknown

RUN --mount=type=cache,target=/root/.m2 \
    mvn package -DskipTests -B \
    -Drevision=${VERSION}

# ── Production stage ─────────────────────────────────────────
FROM gcr.io/distroless/java17-debian12:nonroot

WORKDIR /app

COPY --from=builder /src/target/*.jar /app/app.jar

USER nonroot:nonroot

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

**Java version variants:**

| Java version | Base image |
|---|---|
| Java 17 | `gcr.io/distroless/java17-debian12:nonroot` |
| Java 21 (virtual threads) | `gcr.io/distroless/java21-debian12:nonroot` |

Change the production stage `FROM` line to match your `<java.version>` in `pom.xml`.

**Why distroless:**
- No shell, no package manager, no userspace utilities — minimal attack surface.
- Significantly smaller than a full JDK image; contains only the JRE needed to run Spring Boot.
- Already runs as non-root (`nonroot` user).

**Build args — embed version metadata via `application.yml`:**

```yaml
# src/main/resources/application.yml
info:
  app:
    version: "@project.version@"
    build-date: "@maven.build.timestamp@"
```

Enable Maven resource filtering in `pom.xml`:

```xml
<build>
  <resources>
    <resource>
      <directory>src/main/resources</directory>
      <filtering>true</filtering>
    </resource>
  </resources>
</build>
```

**Commit SHA** — inject at build time via Spring Boot Actuator's `/info` endpoint:

```xml
<!-- pom.xml: add git-commit-id plugin -->
<plugin>
  <groupId>io.github.git-commit-id</groupId>
  <artifactId>git-commit-id-maven-plugin</artifactId>
  <version>7.0.0</version>
  <executions>
    <execution>
      <goals><goal>revision</goal></goals>
    </execution>
  </executions>
  <configuration>
    <generateGitPropertiesFile>true</generateGitPropertiesFile>
    <includeOnlyProperties>
      <includeOnlyProperty>git.commit.id.abbrev</includeOnlyProperty>
      <includeOnlyProperty>git.branch</includeOnlyProperty>
    </includeOnlyProperties>
  </configuration>
</plugin>
```

**JVM tuning flags** for containerised deployments — add to `ENTRYPOINT`:

```dockerfile
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "/app/app.jar"]
```

- `UseContainerSupport` — honours cgroup memory/CPU limits (default ON in Java 11+, but explicit is safer).
- `MaxRAMPercentage=75.0` — heap uses 75% of container memory limit; leaves room for metaspace, threads, off-heap.
- `urandom` — avoids entropy starvation during startup in containers.

**When NOT to use distroless:** if you need native agents (e.g. Datadog APM, async-profiler). Use `eclipse-temurin:17-jre-alpine` and add the agent as a layer.

---

## SECTION 2 — .dockerignore

```
.git
.github
.env
.env.*
*.md
README.md
docs/
deploy/
target/
.mvn/
node_modules/
coverage/
bin/
build/
dist/
tmp/
*.iml
.idea/
.DS_Store
```

---

## SECTION 3 — HEALTH CHECK ENDPOINTS

Spring Boot Actuator provides `/actuator/health` out of the box. Split liveness and readiness:

```yaml
# src/main/resources/application.yml
management:
  endpoint:
    health:
      probes:
        enabled: true          # enables /actuator/health/liveness + /actuator/health/readiness
      show-details: always
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  health:
    livenessstate:
      enabled: true
    readinessstate:
      enabled: true
```

Actuator automatically checks all registered `HealthIndicator` beans (DataSource, Redis, etc.) under `/actuator/health/readiness`.

**Custom readiness check (if you need explicit DB ping):**

```java
// src/main/java/com/nmn/app/health/DatabaseHealthIndicator.java
package com.nmn.app.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseHealthIndicator implements HealthIndicator {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseHealthIndicator(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Health health() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return Health.up()
                    .withDetail("database", "ok")
                    .build();
        } catch (Exception ex) {
            return Health.down()
                    .withDetail("database", "unavailable")
                    .withException(ex)
                    .build();
        }
    }
}
```

**Custom liveness endpoint** (lightweight — process is alive):

```java
// src/main/java/com/nmn/app/health/LivenessHealthIndicator.java
package com.nmn.app.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.actuate.availability.LivenessStateHealthIndicator;
import org.springframework.stereotype.Component;

// Spring Boot registers LivenessStateHealthIndicator automatically
// when probes.enabled=true — no custom code needed for basic liveness.
// Add a custom indicator only if you need application-level liveness logic.
```

Kubernetes probes — point at Actuator endpoints:

```yaml
livenessProbe:
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  initialDelaySeconds: 30     # Spring Boot needs time to start
  periodSeconds: 10
  failureThreshold: 3
readinessProbe:
  httpGet: { path: /actuator/health/readiness, port: 8080 }
  initialDelaySeconds: 15
  periodSeconds: 5
  failureThreshold: 3
startupProbe:
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  failureThreshold: 30        # 30 × 10s = 5 min max startup
  periodSeconds: 10
```

> Use `startupProbe` with Spring Boot — avoids liveness killing slow-starting pods before the app is ready.

---

## SECTION 4 — GRACEFUL SHUTDOWN

Spring Boot handles graceful shutdown natively since 2.3:

```yaml
# src/main/resources/application.yml
server:
  port: 8080
  shutdown: graceful                    # drain in-flight requests on SIGTERM
  tomcat:
    connection-timeout: 5000            # reject slow clients
    threads:
      max: 200
      min-spare: 10

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s    # matches Kubernetes terminationGracePeriodSeconds
```

Spring Boot receives `SIGTERM` from the container runtime, stops accepting new requests, drains in-flight requests, then shuts down the embedded Tomcat, closes DB connections (HikariCP), and flushes telemetry — all automatically in `SmartLifecycle` order.

**Register custom shutdown hooks for non-Spring resources:**

```java
// src/main/java/com/nmn/app/config/ShutdownConfig.java
package com.nmn.app.config;

import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ShutdownConfig {

    private static final Logger log = LoggerFactory.getLogger(ShutdownConfig.class);

    // Example: flush a custom telemetry exporter
    @PreDestroy
    public void onShutdown() {
        log.info("Performing graceful shutdown cleanup");
        // flush metrics, close custom connections, etc.
    }
}
```

**Server timeouts** — set in `application.yml` under `server.tomcat`:

```yaml
server:
  tomcat:
    connection-timeout: 5000        # protect against slowloris (ms)
    keep-alive-timeout: 120000      # idle connection timeout (ms)
```

Key points:
- `server.shutdown=graceful` instructs Spring Boot to stop accepting new requests on shutdown and wait for in-flight requests to complete before closing the embedded server.
- `timeout-per-shutdown-phase` must match Kubernetes `terminationGracePeriodSeconds`.
- HikariCP (default connection pool) closes cleanly on context shutdown — no manual connection pool teardown needed.
- OTel Java agent shuts down via its own shutdown hook, registered automatically.

---

## SECTION 5 — 12-FACTOR COMPLIANCE CHECKLIST

| Factor | Implementation |
|--------|---------------|
| Codebase | One repo per service, tracked in git |
| Dependencies | Declared in `pom.xml`, locked by Maven dependency resolution |
| Config | Environment variables mapped via `@ConfigurationProperties` or `application.yml` |
| Backing services | Attached via URLs (`SPRING_DATASOURCE_URL`, `SPRING_DATA_REDIS_URL`) |
| Build/release/run | CI builds JAR → Docker image → tag → deploy |
| Processes | Stateless; session state in Redis (Spring Session) |
| Port binding | Embedded Tomcat binds port; no external web server required |
| Concurrency | Scale via container replicas; thread pool via `server.tomcat.threads` |
| Disposability | Fast startup (consider GraalVM native or CRaC), graceful shutdown |
| Dev/prod parity | Same Docker image, different env vars / Spring profiles |
| Logs | SLF4J → Logback to stdout as JSON; collected externally |
| Admin processes | One-off Spring Boot CLI runners: `./mvnw spring-boot:run -Dspring-boot.run.arguments=--spring.batch.job.names=migrate` |

---

## SECTION 6 — LOCAL DEVELOPMENT

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports: ["8080:8080"]
    env_file: .env
    environment:
      SPRING_PROFILES_ACTIVE: local
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/app_dev
      SPRING_DATASOURCE_USERNAME: dev
      SPRING_DATASOURCE_PASSWORD: dev
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: app_dev
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  pgdata:
```

**Local Spring profile** — override settings without touching `application.yml`:

```yaml
# src/main/resources/application-local.yml
logging:
  level:
    com.nmn: DEBUG
    org.hibernate.SQL: DEBUG

spring:
  jpa:
    show-sql: true
```

---

## SECTION 7 — RULES

- Never install build tools (Maven, JDK) in the production image — multi-stage only.
- Always run as non-root (`USER nonroot:nonroot` in distroless, or `USER 1000` in JRE images).
- Pin base image to a minor version (`eclipse-temurin:17.0.11_9-jre-alpine`, never `eclipse-temurin:latest`).
- Set `UseContainerSupport` and `MaxRAMPercentage` — JVM ignores cgroup limits without them in older runtimes.
- Health readiness check must verify dependency connectivity (DB ping), not just process liveness.
- Logs to stdout/stderr only — never write to files inside containers; use JSON encoder in Logback.
- One process per container — no supervisord.
- Build deterministically: pin Maven plugin versions, use `--no-transfer-progress` in CI.
- `server.shutdown=graceful` + `timeout-per-shutdown-phase` must align with Kubernetes `terminationGracePeriodSeconds`.
- Scan images: `trivy image ghcr.io/nmn/myservice:tag` in CI.
- Sign and produce SBOMs for production images (`cosign`, `syft`).
- Never commit `.env` files — use `.env.example` as a template.
- Actuator endpoints (`/actuator/**`) must NOT be exposed on the public port in production; bind to a separate management port:

```yaml
management:
  server:
    port: 9090   # internal only; block 9090 at the load balancer / ingress
```
