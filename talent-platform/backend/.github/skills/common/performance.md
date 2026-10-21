# Performance — Enterprise Standard

**Applies to:** All Java Spring Boot projects.

---

## SECTION 1 — PROFILE FIRST, OPTIMISE SECOND

Donald Knuth: "Premature optimisation is the root of all evil." Always profile before changing code for speed.

### 1.1 Spring Boot Actuator + JVM profiling

```yaml
# application.yml — expose metrics and JVM info endpoints
management:
  endpoints:
    web:
      exposure:
        include: health, metrics, prometheus, threaddump, heapdump
  endpoint:
    heapdump:
      enabled: true     # gate behind admin auth in prod
    threaddump:
      enabled: true
```

```bash
# Heap dump — analyse with Eclipse MAT or VisualVM
curl http://localhost:8080/actuator/heapdump -o heap.hprof

# Thread dump — diagnose blocking and deadlocks
curl http://localhost:8080/actuator/threaddump

# JVM metrics via Prometheus scrape
curl http://localhost:8080/actuator/prometheus | grep jvm
```

### 1.2 Async profiler (low-overhead CPU + allocation profiling)

```bash
# Attach to running JVM process (no code change needed)
./asprof -d 30 -f profile.html $(pgrep -f app.jar)
open profile.html   # flame graph in browser
```

Download from: https://github.com/async-profiler/async-profiler

### 1.3 JMH Benchmarks with allocation tracking

```java
// Add to a separate benchmark Maven module — never in production code
import org.openjdk.jmh.annotations.*;

@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@State(Scope.Thread)
public class UrlParseBenchmark {

    @Benchmark
    public URI parseUrl() throws Exception {
        return new URI("https://example.com/foo?bar=baz");
    }
}
```

```bash
# Run with allocation tracking
mvn package -pl benchmark
java -jar benchmark/target/benchmarks.jar -prof gc
# Output: ops/s, ns/op, bytes allocated/op, GC pressure
```

Track regressions in CI by comparing JMH JSON output between branches.

---

## SECTION 2 — ALLOCATION DISCIPLINE

### 2.1 Pre-allocate collections when size is known

```java
// ❌ WRONG — ArrayList grows (copies) multiple times
List<Long> ids = new ArrayList<>();
for (User user : users) {
    ids.add(user.getId());
}

// ✅ CORRECT — single allocation, no resize
List<Long> ids = new ArrayList<>(users.size());
for (User user : users) {
    ids.add(user.getId());
}

// ✅ CORRECT — Stream with sized collector
List<Long> ids = users.stream()
        .map(User::getId)
        .collect(Collectors.toCollection(() -> new ArrayList<>(users.size())));
```

### 2.2 StringBuilder over String concatenation in loops

```java
// ❌ WRONG — creates a new String object on every iteration
String result = "";
for (String part : parts) {
    result += part + ", ";    // N intermediate String allocations
}

// ✅ CORRECT — single buffer, one allocation
StringBuilder sb = new StringBuilder(parts.size() * 16);
for (String part : parts) {
    sb.append(part).append(", ");
}
String result = sb.toString();
```

### 2.3 Object pooling for high-frequency allocations

Use Apache Commons Pool or a simple `ThreadLocal` buffer for objects that are expensive to allocate and safe to reuse:

```java
// ThreadLocal buffer — one per thread, no synchronisation needed
private static final ThreadLocal<StringBuilder> BUFFER =
        ThreadLocal.withInitial(() -> new StringBuilder(512));

public String buildPayload(List<String> parts) {
    StringBuilder sb = BUFFER.get();
    sb.setLength(0);
    for (String part : parts) {
        sb.append(part);
    }
    return sb.toString();
}
```

**Caution:** never pool objects that hold references to request-scoped data — causes data leaks between requests. Always reset before reuse.

### 2.4 Avoid boxing in hot paths

Auto-boxing `int` → `Integer`, `long` → `Long` allocates in hot paths. Use primitive collections where performance matters.

```java
// ❌ HOT PATH — boxing allocates
List<Integer> ids = new ArrayList<>();
ids.add(42);    // boxes int → Integer

// ✅ HOT PATH — no boxing (Eclipse Collections or primitive arrays)
int[] ids = new int[size];

// ✅ For maps: use Eclipse Collections IntObjectMap or Koloboke
MutableIntSet idSet = IntSets.mutable.empty();
idSet.add(42);   // no boxing
```

---

## SECTION 3 — CACHING

### 3.1 In-process: Spring Cache + Caffeine

```xml
<!-- pom.xml -->
<dependency>
  <groupId>com.github.ben-manes.caffeine</groupId>
  <artifactId>caffeine</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

```yaml
# application.yml
spring:
  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=1024,expireAfterWrite=10m
```

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(1024)                    // bounded — unbounded caches are leaks
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .recordStats());                      // exposes hit/miss rate to Micrometer
        return manager;
    }
}
```

```java
@Service
public class CountryService {

    // Cache is populated on first call; subsequent calls return cached value
    @Cacheable(value = "countries", key = "#countryName")
    public Country findByName(String countryName) {
        return countryRepository.findByName(countryName).orElseThrow();
    }

    // Evict on write — keeps cache consistent
    @CacheEvict(value = "countries", key = "#country.name")
    public Country update(Country country) {
        return countryRepository.save(country);
    }
}
```

Rules:
- **Always set a max size** — `maximumSize` in Caffeine. Unbounded caches cause OOM.
- **Pure lookups only** — only cache deterministic, side-effect-free operations.
- **Per-process only** — for cross-replica caching, use Redis (Section 3.2).

### 3.2 Distributed caching with Redis (Spring Cache + Redis)

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

```java
@Service
public class TenantConfigService {

    private static final String KEY_PREFIX = "config:tenant:";
    private static final Duration TTL = Duration.ofMinutes(10);

    private final TenantConfigRepository repo;
    private final RedisTemplate<String, TenantConfig> redisTemplate;

    public TenantConfig getConfig(Long tenantId) {
        String key = KEY_PREFIX + tenantId;

        TenantConfig cached = redisTemplate.opsForValue().get(key);
        if (cached != null) return cached;

        TenantConfig config = repo.findByTenantId(tenantId)
                .orElseThrow(() -> new NotFoundException("TenantConfig", tenantId));

        redisTemplate.opsForValue().set(key, config, TTL);   // always set TTL
        return config;
    }

    public TenantConfig update(TenantConfig config) {
        TenantConfig saved = repo.save(config);
        redisTemplate.delete(KEY_PREFIX + config.getTenantId());   // evict on write
        return saved;
    }
}
```

### 3.3 Cache Invalidation Rules

- Always set a TTL — never cache without expiry.
- Evict on write — when data changes, evict the cache entry immediately.
- Namespace keys by entity + identifier: `user:42`, `config:tenant:7`.
- Document TTL choice in a comment explaining the reason.
- Monitor cache hit rate via Micrometer (`cache.gets` with `result=hit/miss` tags).

---

## SECTION 4 — N+1 QUERY PREVENTION

See `db-design.md` §6.2 — always use `JOIN FETCH`, `@EntityGraph`, or batch loading with `default_batch_fetch_size`.

---

## SECTION 5 — PAGINATION (mandatory for list endpoints)

```java
// ❌ NEVER return unbounded result sets
@GetMapping("/users")
public List<User> listAll() {
    return userRepository.findAll();   // could be millions of rows → OOM
}

// ✅ ALWAYS paginate
@GetMapping("/users")
public Page<UserResponse> list(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {

    if (size < 1 || size > 100) {
        throw new ValidationException("page_size must be 1..100");
    }
    return userRepository.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()))
            .map(userMapper::toResponse);
}
```

Cursor pagination is preferred for large datasets. See `db-design.md` §6.3.

---

## SECTION 6 — HTTP CLIENT TUNING

Spring Boot 3.2+ provides `RestClient` as the synchronous HTTP client (replacing the deprecated `RestTemplate`). Always set explicit connect and read timeouts — the defaults are infinite.

```java
// src/main/java/com/nmn/app/config/HttpClientConfig.java
@Configuration
public class HttpClientConfig {

    // RestClient — synchronous, fluent API (Spring Boot 3.2+)
    @Bean
    public RestClient restClient(RestClient.Builder builder) {
        return builder
            .baseUrl("${app.external-service.base-url}")
            .requestFactory(clientHttpRequestFactory())
            .build();
    }

    @Bean
    public ClientHttpRequestFactory clientHttpRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(10));
        return factory;
    }

    // WebClient — for reactive / async use in WebFlux or parallel fan-out
    @Bean
    public WebClient webClient() {
        HttpClient httpClient = HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5_000)
            .responseTimeout(Duration.ofSeconds(10))
            .doOnConnected(conn -> conn
                .addHandlerLast(new ReadTimeoutHandler(10))
                .addHandlerLast(new WriteTimeoutHandler(5)));

        return WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();
    }
}
```

Usage of `RestClient`:

```java
// Typed service client — wraps RestClient, maps exceptions to AppException subclasses
@Component
@RequiredArgsConstructor
public class InventoryClient {

    private final RestClient restClient;

    public InventoryResponse getStock(String productId) {
        try {
            return restClient.get()
                .uri("/api/v1/inventory/{id}", productId)
                .retrieve()
                .body(InventoryResponse.class);
        } catch (HttpClientErrorException.NotFound ex) {
            throw new ResourceNotFoundException("Product not found: " + productId);
        } catch (RestClientException ex) {
            throw new ExternalServiceException("Inventory service unavailable", ex);
        }
    }
}
```

---

## SECTION 7 — JSON HANDLING

Jackson (Spring Boot default) is well-optimised. For high-throughput services, tune it explicitly:

```java
// src/main/java/com/nmn/app/config/JacksonConfig.java
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        return JsonMapper.builder()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)
            .addModule(new JavaTimeModule())
            // Reuse the same ObjectMapper across the app — never create new instances per request
            .build();
    }
}
```

```java
// ❌ SLOW — creates new ObjectMapper per call (expensive initialisation)
public String serialize(Object obj) throws Exception {
    return new ObjectMapper().writeValueAsString(obj);
}

// ✅ FAST — inject the shared singleton
@Service
public class SerializationService {
    private final ObjectMapper objectMapper;
    public SerializationService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }
}
```

For extreme throughput, consider `jsoniter` (Java port) or pre-computed `TypeReference` caching:

```java
// Cache TypeReference instances — reflection cost paid once
private static final TypeReference<List<UserDto>> USER_LIST_TYPE =
        new TypeReference<List<UserDto>>() {};

List<UserDto> users = objectMapper.readValue(json, USER_LIST_TYPE);
```

Avoid `objectMapper.readValue(json, Map.class)` in hot paths — use typed classes.

---

## SECTION 8 — DATABASE-LAYER PERFORMANCE

- Always use HikariCP connection pool — never create raw `Connection` per request.
- Tune `maximum-pool-size` to the DB's effective concurrency (`(cores × 2) + spindle_count` ≈ 25 for modern Postgres).
- Use `@Transactional(readOnly = true)` on all read operations — Hibernate skips dirty-checking; DB may route to read replica.
- Avoid `SELECT *` via `findAll()` — use projections or DTOs with `@Query` to fetch only required columns.
- Always use `LIMIT` / `Pageable` — defend against runaway queries on large tables.
- Enable `default_batch_fetch_size: 25` in `application.yml` to prevent N+1 on lazy collections automatically.

```yaml
# application.yml — essential DB performance settings
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 25          # N+1 prevention
        jdbc:
          batch_size: 50                      # batch inserts/updates
          order_inserts: true
          order_updates: true
        query:
          plan_cache_max_size: 2048           # cache parsed JPQL query plans
```

---

## SECTION 9 — RESOURCE MONITORING

JVM metrics are exported automatically by Spring Boot Actuator + Micrometer. Key metrics to watch:

```java
// Custom business metric — track hot path execution time
@Service
public class OrderService {

    private final Timer orderProcessingTimer;

    public OrderService(MeterRegistry registry) {
        this.orderProcessingTimer = Timer.builder("orders.processing.duration")
                .description("Time taken to process an order")
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(registry);
    }

    public Order processOrder(Long orderId) {
        return orderProcessingTimer.record(() -> doProcess(orderId));
    }
}
```

Key JVM metrics exposed automatically at `/actuator/prometheus`:

| Metric | What it signals |
|---|---|
| `jvm.memory.used{area=heap}` | Heap pressure — alert > 80% of max |
| `jvm.gc.pause` | GC stop-the-world duration — alert p99 > 200ms |
| `jvm.threads.live` | Thread count — unbounded growth = leak |
| `hikaricp.connections.pending` | Pool exhaustion — increase pool size or add replica |
| `jvm.memory.used{area=nonheap}` | Metaspace — grows on class loading; should plateau |

See `observability.md` for full dashboard and alerting setup.

---

## SECTION 10 — COMMON ANTIPATTERNS

| Pattern | Why bad | Fix |
|---|---|---|
| Creating a new `Thread` per request | OOM, thread leak | Use `ThreadPoolTaskExecutor` or virtual threads |
| `Thread.sleep()` in a hot path | Blocks thread; not cancellable | Use `ScheduledExecutorService` or reactive delay |
| Loading entire result set into memory | OOM on large tables | Stream with `JdbcTemplate` cursor query; paginate |
| `String +=` in a loop | N intermediate String allocations | `StringBuilder` with initial capacity |
| `new ObjectMapper()` per request | Expensive initialisation — reflection, module registration | Inject shared singleton `ObjectMapper` bean |
| `N+1` JPA lazy loading | Latency spike; DB connection exhaustion | `JOIN FETCH`, `@EntityGraph`, `batch_fetch_size` |
| No timeout on `RestClient` / `WebClient` | Thread hangs indefinitely on slow upstream | Always set `connectTimeout` and `readTimeout` |
| `@Transactional` on private methods | Spring AOP silently ignores it — no transaction | Move to public method; or use `self` injection |
| Unbounded `Caffeine` cache | OOM — cache grows without limit | Always set `maximumSize` |
| Reading config from env in hot path | Repeated env lookups | Bind once to `@ConfigurationProperties` at startup |
