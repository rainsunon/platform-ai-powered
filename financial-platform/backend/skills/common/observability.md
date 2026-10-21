# Observability — Enterprise Standard

**Applies to:** All Java Spring Boot services deployed to production.
**Stack:** OpenTelemetry (traces + metrics) + Micrometer (metrics) + SLF4J/Logback (logs) + Spring Actuator. The three pillars.

---

## SECTION 1 — DEPENDENCIES (pom.xml)

```xml
<!-- OpenTelemetry BOM — manages all OTel version alignment -->
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>io.opentelemetry</groupId>
      <artifactId>opentelemetry-bom</artifactId>
      <version>1.38.0</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
    <dependency>
      <groupId>io.opentelemetry.instrumentation</groupId>
      <artifactId>opentelemetry-instrumentation-bom-alpha</artifactId>
      <version>2.4.0-alpha</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>

<dependencies>
  <!-- Spring Boot Actuator — /actuator/health, /actuator/metrics, /actuator/prometheus -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
  </dependency>

  <!-- Micrometer OTel bridge — exports Micrometer metrics via OTLP -->
  <dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-otel</artifactId>
  </dependency>

  <!-- OTLP exporters -->
  <dependency>
    <groupId>io.opentelemetry</groupId>
    <artifactId>opentelemetry-exporter-otlp</artifactId>
  </dependency>

  <!-- Prometheus scrape endpoint (optional — for Prometheus pull model) -->
  <dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
  </dependency>

  <!-- Logback OTel appender — injects trace_id/span_id into logs -->
  <dependency>
    <groupId>io.opentelemetry.instrumentation</groupId>
    <artifactId>opentelemetry-logback-appender-1.0</artifactId>
    <scope>runtime</scope>
  </dependency>
</dependencies>
```

**Alternative — OTel Java Agent (zero-code instrumentation):**

For full auto-instrumentation (Spring MVC, JDBC, RestTemplate, Feign, Kafka, Redis) with zero code changes, attach the OTel Java agent at runtime:

```dockerfile
# Download agent in builder stage
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar /app/otel-agent.jar

ENTRYPOINT ["java", \
  "-javaagent:/app/otel-agent.jar", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "/app/app.jar"]
```

Use the agent for production. Use the SDK directly only when you need custom spans or metrics beyond what the agent provides.

---

## SECTION 2 — OTEL + MICROMETER CONFIGURATION

```yaml
# src/main/resources/application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    export:
      otlp:
        url: ${OTEL_EXPORTER_OTLP_ENDPOINT:http://localhost:4318/v1/metrics}
        step: 30s                  # push interval — equivalent of sdkmetric.WithInterval(30s)
  tracing:
    sampling:
      probability: 1.0             # 1.0 = 100% in dev; use 0.1–0.2 in high-traffic prod
  otlp:
    tracing:
      endpoint: ${OTEL_EXPORTER_OTLP_ENDPOINT:http://localhost:4317}

spring:
  application:
    name: my-service               # maps to service.name in OTel resource
```

```java
// src/main/java/com/nmn/app/config/ObservabilityConfig.java
package com.nmn.app.config;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.sdk.OpenTelemetrySdk;
import io.opentelemetry.sdk.resources.Resource;
import io.opentelemetry.semconv.resource.attributes.ResourceAttributes;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ObservabilityConfig {

    @Value("${spring.application.name}")
    private String serviceName;

    @Value("${info.app.version:dev}")
    private String serviceVersion;

    // Spring Boot auto-configures OpenTelemetry when the OTel starter is on the
    // classpath. Override only if you need custom resource attributes.
    @Bean
    public Resource otelResource() {
        return Resource.getDefault().merge(
            Resource.builder()
                .put(ResourceAttributes.SERVICE_NAME, serviceName)
                .put(ResourceAttributes.SERVICE_VERSION, serviceVersion)
                .build()
        );
    }
}
```

---

## SECTION 3 — FRAMEWORK INTEGRATION

Spring Boot auto-instruments the following when the OTel agent or Micrometer tracing bridge is present — **no manual code required:**

| Component | Auto-instrumented |
|---|---|
| Spring MVC (`@RestController`) | ✅ Incoming HTTP spans |
| `RestClient` / `WebClient` | ✅ Outbound HTTP spans |
| Spring Data JPA / Hibernate | ✅ DB query spans |
| `@Async` tasks | ✅ Span propagation via `TaskDecorator` |
| Spring Kafka | ✅ Producer/consumer spans |
| Spring Cache | ✅ Cache operation spans |

### Outbound HTTP — RestClient (manual if no agent)

```java
// src/main/java/com/nmn/app/config/HttpClientConfig.java
package com.nmn.app.config;

import io.micrometer.observation.ObservationRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class HttpClientConfig {

    @Bean
    public RestClient restClient(
            RestClient.Builder builder, ObservationRegistry observationRegistry) {
        return builder
            .observationRegistry(observationRegistry)   // auto trace + metrics
            .build();
    }
}
```

### Database — Spring Data JPA (manual span enrichment)

```java
// src/main/java/com/nmn/app/config/DataSourceConfig.java
package com.nmn.app.config;

import io.micrometer.observation.ObservationRegistry;
import net.ttddyy.observation.boot.autoconfigure.DataSourceObservationAutoConfiguration;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

// datasource-micrometer-spring-boot — adds query-level tracing
// Add to pom.xml: net.ttddyy.observation:datasource-micrometer-spring-boot:1.0.3
@Configuration
@Import(DataSourceObservationAutoConfiguration.class)
public class DataSourceConfig {}
```

---

## SECTION 4 — CUSTOM SPANS

To create custom spans, use the `@Observed` annotation for declarative tracing or the `Tracer` API directly for fine-grained control:

### Option A — Annotation (preferred for service methods)

```java
// src/main/java/com/nmn/app/service/OrderService.java
package com.nmn.app.service;

import io.micrometer.observation.annotation.Observed;
import org.springframework.stereotype.Service;

@Service
public class OrderService {

    // Creates a span named "order-service.process" automatically
    @Observed(name = "order-service.process",
              contextualName = "processing order",
              lowCardinalityKeyValues = {"layer", "service"})
    public Order process(Long orderId) {
        // ... business logic
        return order;
    }
}
```

Enable `@Observed` by adding an `ObservedAspect` bean:

```java
@Bean
public ObservedAspect observedAspect(ObservationRegistry registry) {
    return new ObservedAspect(registry);
}
```

### Option B — Programmatic spans (for fine-grained control)

```java
// Direct equivalent of tracer.Start / span.RecordError / span.SetStatus
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.StatusCode;
import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.semconv.trace.attributes.SemanticAttributes;

@Service
public class OrderService {

    private final Tracer tracer;

    public OrderService(OpenTelemetry openTelemetry) {
        this.tracer = openTelemetry.getTracer("com.nmn.myservice.service");
    }

    public Order process(Long orderId) {
        Span span = tracer.spanBuilder("OrderService.process")
                .setAttribute("order.id", orderId)
                .startSpan();
        try (var scope = span.makeCurrent()) {

            Order order = repo.findById(orderId)
                    .orElseThrow(() -> new OrderNotFoundException(orderId));

            span.addEvent("payment_started");
            payment.charge(order);
            span.addEvent("payment_completed");

            return order;

        } catch (Exception ex) {
            span.recordException(ex);
            span.setStatus(StatusCode.ERROR, ex.getMessage());
            throw ex;
        } finally {
            span.end();    // equivalent of defer span.End()
        }
    }
}
```

---

## SECTION 5 — METRICS PATTERNS

Spring Boot auto-registers a rich set of JVM and HTTP metrics via Micrometer. Add custom business metrics:

```java
// src/main/java/com/nmn/app/metrics/OrderMetrics.java
package com.nmn.app.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.DistributionSummary;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

@Component
public class OrderMetrics {

    // Counter — monotonically increasing (http.requests.total equivalent)
    private final Counter ordersTotal;

    // Timer — distributions with p50/p95/p99 (http.request.duration_ms equivalent)
    private final Timer orderDuration;

    // Gauge-like — UpDownCounter equivalent
    private final DistributionSummary orderValueSummary;

    public OrderMetrics(MeterRegistry registry) {
        this.ordersTotal = Counter.builder("orders.total")
                .description("Total orders processed")
                .tag("service", "order")
                .register(registry);

        this.orderDuration = Timer.builder("orders.duration")
                .description("Order processing duration")
                .publishPercentiles(0.5, 0.95, 0.99)   // p50, p95, p99
                .publishPercentileHistogram()
                .register(registry);

        this.orderValueSummary = DistributionSummary.builder("orders.value")
                .description("Order value distribution")
                .baseUnit("USD")
                .register(registry);
    }

    public void recordOrder(double valueUsd) {
        ordersTotal.increment();
        orderValueSummary.record(valueUsd);
    }

    public <T> T timeOrder(java.util.concurrent.Callable<T> task) throws Exception {
        return orderDuration.recordCallable(task);
    }
}
```

### Auto HTTP metrics via Actuator

Spring Boot registers `http.server.requests` automatically — method, uri, status, and exception tags included. No manual middleware or instrumentation code required.

Access via:
- `/actuator/metrics/http.server.requests`
- `/actuator/prometheus` (Prometheus scrape format)

---

## SECTION 6 — STRUCTURED LOGS + TRACE CORRELATION

MDC is automatically populated with `traceId` and `spanId` when Micrometer tracing is on the classpath. Configure Logback to include them in every log line:

```xml
<!-- src/main/resources/logback-spring.xml -->
<configuration>

  <springProperty scope="context" name="appName" source="spring.application.name"/>

  <!-- JSON encoder for structured logs — collected by log aggregators (ELK, Loki, etc.) -->
  <appender name="JSON_STDOUT" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
      <providers>
        <timestamp/>
        <logLevel/>
        <loggerName/>
        <message/>
        <mdc/>                    <!-- injects traceId + spanId automatically -->
        <arguments/>
        <stackTrace/>
        <pattern>
          <pattern>{"service": "${appName}"}</pattern>
        </pattern>
      </providers>
    </encoder>
  </appender>

  <root level="INFO">
    <appender-ref ref="JSON_STDOUT"/>
  </root>

</configuration>
```

Add `logstash-logback-encoder` to `pom.xml`:

```xml
<dependency>
  <groupId>net.logstash.logback</groupId>
  <artifactId>logstash-logback-encoder</artifactId>
  <version>7.4</version>
</dependency>
```

**Result** — every log line automatically carries `traceId` and `spanId`, enabling seamless log-to-trace correlation in Grafana, Jaeger, or any OTLP-compatible backend.

---

## SECTION 7 — KEY METRICS TO TRACK (RED + USE)

### RED — request-driven services

| Metric | Micrometer name | Alert when |
|--------|-----------------|------------|
| **R**ate | `http.server.requests` (count/s) | Sudden drop (down) or spike (DDoS) |
| **E**rrors | `http.server.requests` filtered by `status=5xx` | > 1% sustained |
| **D**uration | `http.server.requests` p50/p95/p99 | p99 > SLO threshold |

### USE — resources

| Metric | Micrometer name | Alert when |
|--------|-----------------|------------|
| **U**tilization | `jvm.memory.used`, `system.cpu.usage` | > 80% sustained |
| **S**aturation | `jvm.threads.live`, `hikaricp.connections.pending` | Growing unbounded |
| **E**rrors | `hikaricp.connections.timeout`, `jvm.gc.pause` | Any timeout; GC > 200ms |

**Java-specific JVM metrics** auto-exported by Spring Boot Actuator:

- `jvm.memory.used` / `jvm.memory.max` — heap + non-heap
- `jvm.gc.pause` — GC pause duration (histogram)
- `jvm.threads.live` / `jvm.threads.daemon`
- `hikaricp.connections.active` / `hikaricp.connections.pending`
- `process.cpu.usage` / `system.cpu.usage`
- `jvm.classes.loaded`

All JVM runtime metrics are exported automatically by Spring Boot Actuator — no additional code needed.

---

## SECTION 8 — RULES

- Every service MUST export traces and metrics to an OTLP collector.
- `traceId` and `spanId` MUST appear in every log line (via MDC + Logback encoder — auto with Micrometer tracing).
- Custom spans for any operation > 100ms or crossing a service boundary — use `@Observed` or `Tracer` API.
- Never log PII in span attributes (emails, passwords, tokens).
- Use OTel semantic conventions for attribute names (`http.method`, `db.system`, `rpc.service`).
- Alert on SLO breaches, not just threshold crossings.
- Dashboard per service: request rate, error rate, p95 latency, JVM memory, HikariCP pool utilisation.
- Actuator management endpoints MUST be on a separate internal port (`:9090`) — never exposed publicly.
- Set `management.tracing.sampling.probability` based on traffic: `1.0` in dev/staging, `0.1`–`0.2` in production.
- Always configure `spring.application.name` — it becomes `service.name` in every trace and metric.
- Graceful shutdown flushes OTel data automatically via the Spring context lifecycle — no manual shutdown call needed.
