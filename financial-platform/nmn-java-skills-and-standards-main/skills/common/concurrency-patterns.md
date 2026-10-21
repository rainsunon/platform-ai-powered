# Concurrency Patterns — Enterprise Standard

**Applies to:** All Java Spring Boot projects using threads, async tasks, or shared state.
**Authority:** Java Memory Model (JMM), `java.util.concurrent`, Project Loom (Virtual Threads), Spring `@Async`.

---

## SECTION 1 — CORE RULES

| # | Rule |
|---|---|
| 1 | Always run thread-safety tests with a race-condition-aware framework (`-DforkCount=1 -Dthreads=N` or Awaitility). Failures block merge. |
| 2 | Every thread/task has a clear lifecycle — bound by an `ExecutorService`, `CompletableFuture`, or `@Async` managed pool. |
| 3 | Never use raw `new Thread()` in application code — always delegate to a managed executor. |
| 4 | Prefer immutable objects (`record`, `final` fields) — shared mutable state requires explicit synchronisation. |
| 5 | Pass context (trace ID, user, tenant) via `MDC` + structured copies into child threads — never via `ThreadLocal` alone (it leaks across thread pool reuse). |
| 6 | Don't share mutable state; communicate via queues (`BlockingQueue`, reactive streams). When you must share, protect with `java.util.concurrent` primitives. |
| 7 | Always shut down `ExecutorService` instances explicitly — use `try-with-resources` (Java 19+) or `@PreDestroy`. |
| 8 | Virtual threads (Java 21+) are available via `Executors.newVirtualThreadPerTaskExecutor()`. Prefer them for I/O-bound tasks over large platform thread pools. |

---

## SECTION 2 — STRUCTURED CONTEXT PROPAGATION

Java has no built-in `context.Context`, but Spring provides `RequestContextHolder` and MDC for propagating request-scoped data (trace ID, user, tenant) across async boundaries.

### 2.1 MDC propagation — always copy MDC into child threads

```java
// ❌ WRONG — MDC is ThreadLocal; child thread loses it
executor.submit(() -> {
    log.info("processing");   // MDC empty — no trace ID in log
    doWork();
});

// ✅ CORRECT — capture and restore MDC
Map<String, String> mdcCopy = MDC.getCopyOfContextMap();
executor.submit(() -> {
    if (mdcCopy != null) MDC.setContextMap(mdcCopy);
    try {
        log.info("processing");   // trace ID present
        doWork();
    } finally {
        MDC.clear();              // avoid leaking into thread-pool thread
    }
});
```

### 2.2 Request-scoped values — custom context carrier

```java
// src/main/java/com/nmn/app/context/RequestContext.java
package com.nmn.app.context;

public record RequestContext(
    String requestId,
    String userId,
    String tenantId
) {}
```

```java
// Propagate into CompletableFuture
RequestContext ctx = RequestContextHolder.current();   // your holder
CompletableFuture.runAsync(() -> {
    RequestContextHolder.set(ctx);
    try {
        process();
    } finally {
        RequestContextHolder.clear();
    }
}, executor);
```

### 2.3 Task decorator — automate MDC propagation in Spring @Async

Configure a `TaskDecorator` once; all `@Async` tasks get automatic MDC propagation:

```java
// src/main/java/com/nmn/app/config/AsyncConfig.java
package com.nmn.app.config;

import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskDecorator;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.Map;
import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(8);
        executor.setMaxPoolSize(32);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("async-");
        executor.setTaskDecorator(new MdcTaskDecorator());
        executor.initialize();
        return executor;
    }

    static class MdcTaskDecorator implements TaskDecorator {
        @Override
        public Runnable decorate(Runnable task) {
            Map<String, String> mdcCopy = MDC.getCopyOfContextMap();
            return () -> {
                if (mdcCopy != null) MDC.setContextMap(mdcCopy);
                try {
                    task.run();
                } finally {
                    MDC.clear();
                }
            };
        }
    }
}
```

### 2.4 Context values — only request-scoped data

```java
// ✅ Store only: requestId, userId, tenantId, traceId
// ❌ Never store: dependencies, config, optional arguments — inject those via Spring IoC
```

---

## SECTION 3 — TASK LIFECYCLES

Every task submitted to an executor must have a clear completion or cancellation path.

### 3.1 Bounded by CompletableFuture with timeout

```java
// Correct — bounded with explicit timeout and error handling
CompletableFuture<User> future = CompletableFuture
    .supplyAsync(() -> userService.findById(id), executor)
    .orTimeout(5, TimeUnit.SECONDS)           // cancel if not done in 5s
    .exceptionally(ex -> {
        log.warn("user_fetch_failed", ex);
        return null;
    });
```

### 3.2 Bounded by ExecutorService + shutdown

```java
ExecutorService executor = Executors.newFixedThreadPool(8);
try {
    List<Future<Result>> futures = executor.invokeAll(tasks, 30, TimeUnit.SECONDS);
    for (Future<Result> f : futures) {
        results.add(f.get());
    }
} finally {
    executor.shutdown();                               // stop accepting new tasks
    if (!executor.awaitTermination(10, TimeUnit.SECONDS)) {
        executor.shutdownNow();                        // interrupt running tasks
    }
}
```

### 3.3 Run parallel tasks — return first error

```java
// Parallel execution — collect all results, surface first error
List<CompletableFuture<Result>> futures = users.stream()
    .map(user -> CompletableFuture.supplyAsync(() -> process(user), executor))
    .toList();

CompletableFuture<Void> all = CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]));

try {
    all.get(30, TimeUnit.SECONDS);
} catch (ExecutionException ex) {
    throw new RuntimeException("parallel task failed", ex.getCause());
} catch (TimeoutException ex) {
    futures.forEach(f -> f.cancel(true));     // cancel remaining
    throw new ServiceException("parallel processing timed out");
}

List<Result> results = futures.stream()
    .map(CompletableFuture::join)
    .toList();
```

### 3.4 Bounded concurrency — semaphore pattern

```java
Semaphore semaphore = new Semaphore(8);   // max 8 concurrent tasks

List<CompletableFuture<Void>> futures = users.stream()
    .map(user -> CompletableFuture.runAsync(() -> {
        try {
            semaphore.acquire();
            process(user);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        } finally {
            semaphore.release();
        }
    }, executor))
    .toList();

CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
```

### 3.5 The fire-and-forget anti-pattern

```java
// ❌ WRONG — unmanaged thread, no error surfacing, no lifecycle
new Thread(() -> backgroundJob()).start();

// ✅ CORRECT — managed, observable, cancellable
CompletableFuture<Void> task = CompletableFuture
    .runAsync(() -> backgroundJob(), executor)
    .exceptionally(ex -> {
        log.error("background_job_failed", ex);
        return null;
    });
// track the future; cancel if service shuts down
```

---

## SECTION 4 — BLOCKING QUEUES

### 4.1 Producer-consumer with BlockingQueue

```java
// Correct — producer owns queue lifecycle; signals done via poison pill
BlockingQueue<Job> queue = new LinkedBlockingQueue<>(100);   // bounded = backpressure
Job POISON = new Job(null);   // sentinel to signal shutdown

// Producer
executor.submit(() -> {
    try {
        for (Job job : jobs) {
            queue.put(job);          // blocks if queue is full (backpressure)
        }
        queue.put(POISON);           // signal done
    } catch (InterruptedException ex) {
        Thread.currentThread().interrupt();
    }
});

// Consumer
executor.submit(() -> {
    try {
        while (true) {
            Job job = queue.take();  // blocks until available
            if (job == POISON) return;
            process(job);
        }
    } catch (InterruptedException ex) {
        Thread.currentThread().interrupt();
    }
});
```

### 4.2 Queue types

| Type | When |
|---|---|
| `ArrayBlockingQueue(n)` | Bounded; predictable memory; preferred for production |
| `LinkedBlockingQueue()` | Unbounded — hides backpressure problems; use with caution |
| `LinkedBlockingQueue(n)` | Bounded linked queue; good default |
| `SynchronousQueue` | Zero-capacity — each put blocks until a take; synchronous handoff |
| `PriorityBlockingQueue` | Ordered processing; items must implement `Comparable` |

### 4.3 Poll with timeout — cancellable receive

```java
while (!Thread.currentThread().isInterrupted()) {
    Job job = queue.poll(1, TimeUnit.SECONDS);   // non-blocking poll with timeout
    if (job == null) continue;                   // timed out, check interrupt and retry
    process(job);
}
```

---

## SECTION 5 — SYNCHRONISATION PRIMITIVES

### 5.1 synchronized / ReentrantLock

```java
// Intrinsic lock — simple, always released on exception
public class Counter {
    private int value;

    public synchronized void increment() {
        value++;
    }

    public synchronized int getValue() {
        return value;
    }
}

// ReentrantLock — when you need try-lock, timed lock, or fairness
public class Counter {
    private final ReentrantLock lock = new ReentrantLock();
    private int value;

    public void increment() {
        lock.lock();
        try {
            value++;
        } finally {
            lock.unlock();    // always in finally
        }
    }
}
```

Rules:
- Always release the lock in a `finally` block — guarantees release on exception.
- `ReentrantLock` **is** reentrant — the same thread can acquire it multiple times.
- Never call blocking I/O or external services while holding a lock.

### 5.2 ReadWriteLock

Use only when reads vastly outnumber writes — the bookkeeping cost is non-trivial.

```java
private final ReadWriteLock rwLock = new ReentrantReadWriteLock();
private final Map<String, Item> cache = new HashMap<>();

public Item get(String key) {
    rwLock.readLock().lock();
    try {
        return cache.get(key);
    } finally {
        rwLock.readLock().unlock();
    }
}

public void put(String key, Item value) {
    rwLock.writeLock().lock();
    try {
        cache.put(key, value);
    } finally {
        rwLock.writeLock().unlock();
    }
}
```

### 5.3 Lazy initialisation — double-checked locking

```java
public class ConnectionHolder {
    private volatile Connection connection;   // volatile is mandatory

    public Connection getConnection() {
        if (connection == null) {
            synchronized (this) {
                if (connection == null) {          // second check inside lock
                    connection = createConnection();
                }
            }
        }
        return connection;
    }
}

// Or — simpler, prefer this: class-level holder idiom
public class ConnectionHolder {
    private static class Holder {
        static final Connection INSTANCE = createConnection();
    }
    public static Connection getInstance() { return Holder.INSTANCE; }
}
```

### 5.4 CountDownLatch

```java
CountDownLatch latch = new CountDownLatch(users.size());

for (User user : users) {
    executor.submit(() -> {
        try {
            process(user);
        } finally {
            latch.countDown();     
        }
    });
}
latch.await(30, TimeUnit.SECONDS);
```

**Critical:** submit all tasks **before** calling `await`.

### 5.5 Atomic variables

For single-variable read/write/CAS without a lock:

```java
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

AtomicLong counter = new AtomicLong(0);
counter.incrementAndGet();
long v = counter.get();

// CAS — optimistic update
AtomicReference<State> stateRef = new AtomicReference<>(State.IDLE);
boolean updated = stateRef.compareAndSet(State.IDLE, State.RUNNING);
```

Use `java.util.concurrent.atomic` classes — never manually synchronise on primitive wrappers (`Integer`, `Long`).

### 5.6 Concurrent collections — prefer over synchronized wrappers

```java
// ✅ Correct — lock-striped, high throughput
Map<String, Item>   map   = new ConcurrentHashMap<>();
List<Item>          list  = new CopyOnWriteArrayList<>();   // reads >> writes only
Queue<Job>          queue = new ConcurrentLinkedQueue<>();
BlockingQueue<Job>  bq    = new LinkedBlockingQueue<>(1000);

// ❌ Wrong — coarse-grained lock, poor throughput
Map<String, Item>  map  = Collections.synchronizedMap(new HashMap<>());
```

---

## SECTION 6 — WORKER POOLS

```java
// src/main/java/com/nmn/app/worker/JobProcessor.java
package com.nmn.app.worker;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.concurrent.*;

public class JobProcessor {

    private static final Logger log = LoggerFactory.getLogger(JobProcessor.class);

    // Bounded worker pool — explicit executor, bounded queue
    public List<Result> runPool(List<Job> jobs, int workers) throws InterruptedException {
        BlockingQueue<Runnable> taskQueue = new ArrayBlockingQueue<>(jobs.size());
        ExecutorService pool = new ThreadPoolExecutor(
                workers, workers,
                0L, TimeUnit.MILLISECONDS,
                taskQueue,
                new ThreadPoolExecutor.CallerRunsPolicy()   // backpressure: caller runs if full
        );

        List<Future<Result>> futures = new ArrayList<>();
        for (Job job : jobs) {
            futures.add(pool.submit(() -> process(job)));
        }

        pool.shutdown();
        pool.awaitTermination(60, TimeUnit.SECONDS);

        return futures.stream()
                .map(f -> {
                    try { return f.get(); }
                    catch (Exception ex) { throw new RuntimeException(ex); }
                })
                .toList();
    }

    private Result process(Job job) {
        // ... processing logic
        return new Result(job);
    }
}
```

**Spring Boot** — prefer `@Async` with a configured `ThreadPoolTaskExecutor` (see §3 `AsyncConfig`) for service-layer parallelism.

---

## SECTION 7 — VIRTUAL THREADS (Java 21+)

Virtual threads are the Java 21 answer to goroutines — cheap, JVM-managed, ideal for I/O-bound work.

```java
// Create a virtual-thread-per-task executor
ExecutorService vExecutor = Executors.newVirtualThreadPerTaskExecutor();

// Submit I/O-bound tasks — no thread pool tuning needed
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<Result>> futures = users.stream()
            .map(user -> executor.submit(() -> fetchFromDb(user)))
            .toList();
    // collect results ...
}

// Spring Boot 3.2+ — enable virtual threads globally
// application.yml
// spring.threads.virtual.enabled: true
```

**When to use virtual threads:**
- HTTP calls, DB queries, file I/O — anything that blocks waiting for external resources.
- High-concurrency scenarios where platform thread pool tuning is burdensome.

**When NOT to use virtual threads:**
- CPU-bound computation — use a `ForkJoinPool` with parallelism = CPU cores.
- When holding `synchronized` monitors for long durations (virtual threads pin the carrier thread; prefer `ReentrantLock` instead).

---

## SECTION 8 — THREAD-SAFETY TESTING

```xml
<!-- pom.xml: Surefire with parallel test execution -->
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-surefire-plugin</artifactId>
  <configuration>
    <parallel>methods</parallel>
    <threadCount>4</threadCount>
  </configuration>
</plugin>
```

```java
// Use Awaitility for async assertions — avoid Thread.sleep()
import static org.awaitility.Awaitility.await;
import java.util.concurrent.TimeUnit;

@Test
void counter_is_threadsafe() throws InterruptedException {
    AtomicCounter counter = new AtomicCounter();
    ExecutorService executor = Executors.newFixedThreadPool(8);

    for (int i = 0; i < 1000; i++) {
        executor.submit(counter::increment);
    }
    executor.shutdown();
    executor.awaitTermination(5, TimeUnit.SECONDS);

    assertThat(counter.getValue()).isEqualTo(1000);
}

// Awaitility — wait for async side effect
@Test
void async_event_is_processed() {
    eventBus.publish(new OrderEvent(orderId));

    await().atMost(5, TimeUnit.SECONDS)
           .until(() -> orderRepository.findById(orderId).isPresent());
}
```

CI must run tests with parallel execution enabled. Never ignore `InterruptedException` — it signals thread cancellation.

---

## SECTION 9 — DEADLOCK & STARVATION SMELLS

| Smell | Likely problem |
|---|---|
| Two threads acquiring locks in opposite order | Classic lock-ordering deadlock |
| Blocking I/O inside a `synchronized` block | Holder blocks all other threads for the duration of the I/O |
| `synchronized` method calling another `synchronized` method on same instance | Reentrant — fine in Java, but review if behaviour is intentional |
| `CompletableFuture.get()` called inside an async task on the same executor | Deadlock if pool is saturated |
| Large `ThreadPoolExecutor` queue with slow consumer | Latency spike when queue fills; memory pressure |
| `ThreadLocal` values not cleared after task | Stale data leaks into the next task on the same thread |

---

## SECTION 10 — ANTI-PATTERNS

```java
// 1. Unmanaged thread — no lifecycle, no error surfacing
new Thread(() -> { while(true) doWork(); }).start();   // ❌

// 2. Swallowing InterruptedException — breaks cancellation
try {
    Thread.sleep(1000);
} catch (InterruptedException ex) {
    // ❌ WRONG — silently swallowed
}
// ✅ CORRECT — restore interrupt status
} catch (InterruptedException ex) {
    Thread.currentThread().interrupt();
    throw new RuntimeException(ex);
}

// 3. CountDownLatch.countDown() outside finally — won't fire on exception
executor.submit(() -> {
    process(user);
    latch.countDown();    // ❌ skipped if process() throws
});
// ✅ CORRECT
executor.submit(() -> {
    try { process(user); }
    finally { latch.countDown(); }
});

// 4. Calling CompletableFuture.get() on the common pool from within the common pool
CompletableFuture.supplyAsync(() ->
    CompletableFuture.supplyAsync(() -> work()).get()   // ❌ potential deadlock
);

// 5. ThreadLocal without remove() — leaks into pooled thread's next task
threadLocal.set(value);
doWork();
// threadLocal.remove(); ❌ missing — next task on same thread sees stale value
// ✅ always in finally:
try {
    threadLocal.set(value);
    doWork();
} finally {
    threadLocal.remove();
}

// 6. Sleeping instead of scheduling
while (true) {
    Thread.sleep(1000);   // ❌ not cancellable cleanly
    check();
}
// ✅ CORRECT — use ScheduledExecutorService
scheduler.scheduleAtFixedRate(this::check, 0, 1, TimeUnit.SECONDS);

// 7. Blocking inside @Transactional — holds DB connection for duration of wait
@Transactional
public void processAsync() throws Exception {
    future.get(30, TimeUnit.SECONDS);   // ❌ DB connection held while waiting
}
// ✅ CORRECT — resolve the future first, then open the transaction
```

---

## SECTION 11 — @Scheduled TASKS

Spring's `@Scheduled` is single-threaded by default: if one execution takes longer than its interval, the next run queues up rather than running in parallel. Always configure a dedicated `TaskScheduler`.

```java
// config/SchedulingConfig.java
@Configuration
@EnableScheduling
public class SchedulingConfig {

    @Bean
    public TaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(4);
        scheduler.setThreadNamePrefix("scheduler-");
        scheduler.setErrorHandler(ex ->
            LoggerFactory.getLogger(SchedulingConfig.class)
                .error("Scheduled task failed", ex));
        return scheduler;
    }
}
```

```java
// service/ReportScheduler.java
@Component
@RequiredArgsConstructor
@Slf4j
public class ReportScheduler {

    private final ReportService reportService;

    // fixedDelay — waits for previous execution to finish before starting next
    @Scheduled(fixedDelayString = "${app.scheduler.report-delay-ms:60000}")
    public void generateDailyReports() {
        log.info("Starting scheduled report generation");
        reportService.generateAll();
        log.info("Scheduled report generation complete");
    }

    // cron — runs at fixed wall-clock time regardless of execution duration
    @Scheduled(cron = "${app.scheduler.cleanup-cron:0 0 2 * * ?}", zone = "UTC")
    public void cleanupExpiredTokens() {
        reportService.deleteExpiredTokens();
    }
}
```

**fixedRate vs fixedDelay:**

| Property | Behaviour | Use when |
|---|---|---|
| `fixedRate` | Fires every N ms regardless of execution duration — can pile up | Fast, idempotent tasks with no drift tolerance |
| `fixedDelay` | Waits N ms after previous execution finishes | Tasks that must not overlap |
| `cron` | Wall-clock schedule | Business-time tasks (daily report, midnight cleanup) |

**Testing scheduled tasks:**

```java
// Use @SpyBean to verify the scheduled method was called without waiting real time
@SpringBootTest
class ReportSchedulerIT {

    @SpyBean
    private ReportScheduler reportScheduler;

    @Test
    @DisplayName("generateDailyReports is invoked by the scheduler")
    void generateDailyReports_isInvokedByScheduler() {
        await().atMost(5, TimeUnit.SECONDS)
            .untilAsserted(() ->
                then(reportScheduler).should(atLeastOnce()).generateDailyReports());
    }
}
```
