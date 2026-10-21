---
name: kafka
description: |
  Generates production-ready Kafka producer and consumer code for Spring Boot
  projects following NMN standards. Use this skill whenever the user asks
  to: set up Kafka in Spring Boot, create a Kafka producer or publisher, create
  a Kafka consumer or listener, define a Kafka event or message, configure
  KafkaTemplate, add @KafkaListener, set up dead letter queues or DLT, add
  @RetryableTopic, configure Kafka serialization or deserialization, set up
  Kafka transactions, add Kafka error handling, configure consumer groups, set
  up Kafka with Testcontainers, write Kafka integration tests, implement
  event-driven architecture, implement the outbox pattern, set up Kafka Streams,
  configure Kafka for production, add Kafka observability or metrics, or any
  task involving Spring Kafka, Apache Kafka, event-driven messaging, or
  asynchronous event publishing. Even if the user says "publish an event",
  "consume a message", "add an event bus", "make it async via events", or
  "notify other services" — trigger this skill.
---

# Kafka Skill — NMN Standards

## When to use Kafka vs synchronous REST/gRPC

| Use Kafka | Use REST / gRPC |
|-----------|----------------|
| Fire-and-forget notifications | Need immediate response |
| Fan-out to multiple consumers | Simple request-reply |
| Eventual consistency acceptable | Strong consistency required |
| Decoupling services (Saga pattern) | Low-latency direct calls |
| Audit log / event sourcing | Simple CRUD between services |
| High-throughput event streams | Few events per second |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 17+ |
| Build | Maven 3.9+ |
| Framework | Spring Boot 3.x + Spring Kafka |
| Serialization | Jackson JSON (`JsonSerializer` / `JsonDeserializer`) |
| Schema registry | Confluent Schema Registry (optional — for Avro) |
| Retry / DLT | `@RetryableTopic` (Spring Kafka 2.7+) |
| Testing | JUnit 5 + `@EmbeddedKafka` + Testcontainers Kafka |
| Observability | Micrometer Kafka metrics + OpenTelemetry |
| Code Style | `google-java-format` — 2-space indent |
| Logging | SLF4J + `@Slf4j` |

---

## Package structure

```
com.nmn.{projectname}/
├── event/
│   ├── {Domain}Event.java            ← typed event record (payload contract)
│   ├── publisher/
│   │   └── {Domain}EventPublisher.java   ← KafkaTemplate wrapper
│   └── consumer/
│       └── {Domain}EventConsumer.java    ← @KafkaListener handler
├── config/
│   └── KafkaConfig.java              ← producer/consumer factory beans
└── service/
    └── impl/{Feature}ServiceImpl.java ← calls publisher after business logic
```

---

## Hard rules — enforce on every generation

1. **Typed event records** — always use a Java `record` for the event payload — never `Map<String, Object>` or raw `String`
2. **Event record is the contract** — treat it like a proto file; changing field names is a breaking change
3. **Constructor injection only** — never `@Autowired` on fields
4. **Publish after business logic succeeds** — never publish before the DB transaction commits (use outbox pattern or `@TransactionalEventListener`)
5. **Every consumer topic has a DLT** — `{topic}.DLT` — use `@RetryableTopic` for automatic retry + DLT routing
6. **`acks=all` in production** — never `acks=1` or `acks=0` for important events
7. **`enable.idempotence=true` in production** — prevents duplicate publishes on retry
8. **Typed deserializer with trusted packages** — always set `spring.json.trusted.packages` — never `*` in production
9. **`@Slf4j` + SLF4J `{}` placeholders** — never `System.out.println`
10. **Log `orderId` / `entityId` not the full event payload** — events may contain PII
11. **Never `.get()` or `.join()` on the `KafkaTemplate.send()` future in production** — use `thenAccept` / `exceptionally` async callbacks
12. **Consumer group ID from config** — `groupId = "${app.kafka.group-id}"` — never hardcoded string
13. **Propagate `X-Request-ID` via Kafka headers** — for distributed tracing correlation
14. **`@Transactional` on consumer methods** — ensures message is only committed if business logic succeeds

---

## Event record (payload contract)

```java
// event/OrderCompletedEvent.java
// Java record — immutable, serialization-friendly, clear contract
public record OrderCompletedEvent(

    String    orderId,        // always String for IDs — avoids Long serialization edge cases
    String    customerId,
    String    total,          // String for monetary values — never double
    String    currency,
    String    status,
    Instant   occurredAt,     // always include — enables event ordering and replay
    String    requestId       // propagate X-Request-ID for distributed tracing

) {
  // Compact constructor for validation
  public OrderCompletedEvent {
    Objects.requireNonNull(orderId,    "orderId must not be null");
    Objects.requireNonNull(customerId, "customerId must not be null");
    Objects.requireNonNull(occurredAt, "occurredAt must not be null");
  }
}
```

**Event naming convention:**
```
Pattern:  {Domain}{Action}Event
Examples:
  OrderCreatedEvent
  OrderCompletedEvent
  PaymentProcessedEvent
  UserRegisteredEvent
  InventoryReservedEvent
```

**Topic naming convention:**
```
Pattern:  {domain}.{action}
Examples:
  order.created
  order.completed
  payment.processed
  user.registered
  inventory.reserved

DLT (auto-created by @RetryableTopic):
  order.created.DLT
  payment.processed.DLT
```

---

## Producer — event publisher

```java
// event/publisher/OrderEventPublisher.java
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventPublisher {

  private final KafkaTemplate<String, OrderCompletedEvent> kafkaTemplate;

  private static final String TOPIC_ORDER_COMPLETED = "order.completed";

  /**
   * Publishes an order completed event to Kafka.
   * Call this AFTER the DB transaction has committed.
   */
  public void publishOrderCompleted(Order order, String requestId) {
    OrderCompletedEvent event = new OrderCompletedEvent(
        order.getId().toString(),
        order.getCustomerId().toString(),
        order.getTotal().toPlainString(),
        order.getCurrency(),
        order.getStatus().name(),
        Instant.now(),
        requestId
    );

    kafkaTemplate.send(TOPIC_ORDER_COMPLETED, event.orderId(), event)
        .thenAccept(result -> log.info(
            "Published: topic={} partition={} offset={} orderId={}",
            result.getRecordMetadata().topic(),
            result.getRecordMetadata().partition(),
            result.getRecordMetadata().offset(),
            event.orderId()))
        .exceptionally(ex -> {
          log.error("Failed to publish order.completed: orderId={}", event.orderId(), ex);
          // Do NOT rethrow — publishing failure is handled by retry/outbox
          return null;
        });
  }
}
```

---

## Publishing safely after DB commit

```java
// WRONG — publishes BEFORE transaction commits
// If DB commit fails after publish, the event is already sent — inconsistency
@Transactional
public OrderResponse create(OrderRequest request) {
  Order saved = orderRepository.save(orderMapper.toEntity(request));
  eventPublisher.publishOrderCompleted(saved, requestId); // WRONG — too early
  return orderMapper.toResponse(saved);
}

// CORRECT — Option 1: publish AFTER @Transactional method returns
// Service creates the order, caller publishes after commit
@Transactional
public OrderResponse create(OrderRequest request) {
  Order saved = orderRepository.save(orderMapper.toEntity(request));
  return orderMapper.toResponse(saved);
}

// In controller (or orchestrating service):
OrderResponse response = orderService.create(request);
eventPublisher.publishOrderCompleted(savedOrder, requestId); // after commit

// CORRECT — Option 2: @TransactionalEventListener (Spring's built-in solution)
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

  private final OrderRepository   orderRepository;
  private final ApplicationEventPublisher springEventPublisher;  // Spring internal

  @Transactional
  public OrderResponse create(OrderRequest request) {
    Order saved = orderRepository.save(orderMapper.toEntity(request));
    // Publish Spring internal event — Kafka publish happens AFTER commit
    springEventPublisher.publishEvent(new OrderCreatedDomainEvent(saved));
    return orderMapper.toResponse(saved);
  }
}

// Listener fires AFTER transaction commits — then publishes to Kafka
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderKafkaEventBridge {

  private final OrderEventPublisher kafkaPublisher;

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void onOrderCreated(OrderCreatedDomainEvent event) {
    kafkaPublisher.publishOrderCompleted(event.order(), MDC.get("requestId"));
  }
}

// CORRECT — Option 3: Outbox pattern (strongest guarantee — see below)
```

---

## Consumer — event listener

```java
// event/consumer/OrderEventConsumer.java
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventConsumer {

  private final NotificationService notificationService;
  private final OrderRepository     orderRepository;

  /**
   * Handles order.completed events.
   * @RetryableTopic handles retries and DLT routing automatically.
   */
  @RetryableTopic(
      attempts         = "4",                    // 1 original + 3 retries
      backoff          = @Backoff(
          delay        = 1_000,
          multiplier   = 2.0,
          maxDelay     = 30_000
      ),
      autoCreateTopics = "false",                // create topics in infra, not app code
      dltStrategy      = DltStrategy.FAIL_ON_ERROR
  )
  @KafkaListener(
      topics           = "order.completed",
      groupId          = "${app.kafka.group-id}",
      containerFactory = "kafkaListenerContainerFactory"
  )
  @Transactional                                 // rolls back if business logic fails
  public void handleOrderCompleted(
      OrderCompletedEvent event,
      @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
      @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
      @Header(KafkaHeaders.OFFSET) long offset) {

    // Restore request ID for distributed tracing
    String requestId = Optional.ofNullable(event.requestId())
        .orElse(UUID.randomUUID().toString());
    MDC.put("requestId", requestId);

    try {
      log.info("Consuming: topic={} partition={} offset={} orderId={}",
          topic, partition, offset, event.orderId());

      notificationService.sendOrderConfirmation(
          event.customerId(), event.orderId());

      log.info("Consumed: orderId={}", event.orderId());

    } finally {
      MDC.clear();   // always clear — thread pool reuse
    }
  }

  /**
   * DLT handler — called when all retries are exhausted.
   * Persists the failed event for manual reprocessing.
   */
  @DltHandler
  public void handleDlt(
      OrderCompletedEvent event,
      @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
      @Header(KafkaHeaders.EXCEPTION_MESSAGE) String errorMessage) {

    log.error("DLT: topic={} orderId={} error={}",
        topic, event.orderId(), errorMessage);
    deadLetterEventRepository.save(new DeadLetterEvent(
        topic, event.orderId(), toJson(event), errorMessage, Instant.now()));
  }
}
```

---

## Dead-letter event table

Persist failed events so the ops team can inspect and replay them without losing data.

```java
// model/DeadLetterEvent.java
@Entity
@Table(name = "dead_letter_events")
@Getter @Setter
public class DeadLetterEvent {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false) private String topic;
  @Column(nullable = false) private String aggregateId;
  @Column(nullable = false, columnDefinition = "TEXT") private String payload;
  @Column(columnDefinition = "TEXT") private String errorMessage;
  @Column(nullable = false) private Instant failedAt;
  private Instant resolvedAt;  // set when manually replayed and resolved

  public DeadLetterEvent(String topic, String aggregateId,
      String payload, String errorMessage, Instant failedAt) {
    this.topic        = topic;
    this.aggregateId  = aggregateId;
    this.payload      = payload;
    this.errorMessage = errorMessage;
    this.failedAt     = failedAt;
  }
}
```

```sql
-- db/migration/V__create_dead_letter_events.sql
CREATE TABLE dead_letter_events (
    id            BIGSERIAL PRIMARY KEY,
    topic         VARCHAR(255)  NOT NULL,
    aggregate_id  VARCHAR(255)  NOT NULL,
    payload       TEXT          NOT NULL,
    error_message TEXT,
    failed_at     TIMESTAMPTZ   NOT NULL,
    resolved_at   TIMESTAMPTZ
);

CREATE INDEX ix_dead_letter_events_topic_failed_at
    ON dead_letter_events (topic, failed_at);
```

---

## Outbox pattern (strongest delivery guarantee)

Use when you cannot afford to lose events even if Kafka is temporarily unavailable:

```java
// model/OutboxEvent.java — stored in the same DB as the business data
@Entity
@Table(name = "outbox_events")
@Getter @Setter
public class OutboxEvent {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false) private String aggregateType;  // "Order"
  @Column(nullable = false) private String aggregateId;    // orderId
  @Column(nullable = false) private String eventType;      // "OrderCompletedEvent"
  @Column(nullable = false, columnDefinition = "TEXT")
  private String payload;                                   // JSON serialized event
  @Column(nullable = false) private String topic;
  @Column(nullable = false) private Instant createdAt;
  private Instant publishedAt;                             // null = not yet published
}

// service/impl/OrderServiceImpl.java — write to outbox in same transaction
@Transactional
public OrderResponse create(OrderRequest request) {
  Order saved = orderRepository.save(orderMapper.toEntity(request));

  // Write event to outbox table in same transaction — atomic
  outboxRepository.save(new OutboxEvent(
      "Order", saved.getId().toString(),
      "OrderCompletedEvent", toJson(saved), "order.completed",
      Instant.now()
  ));

  return orderMapper.toResponse(saved);
}

// scheduler/OutboxPublisher.java — polls outbox and publishes to Kafka
@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisher {

  private final OutboxRepository        outboxRepository;
  private final KafkaTemplate<String, String> kafkaTemplate;

  @Scheduled(fixedDelay = 1_000)   // poll every 1 second
  @Transactional
  public void publishPending() {
    List<OutboxEvent> pending = outboxRepository
        .findByPublishedAtIsNullOrderByCreatedAtAsc(PageRequest.of(0, 100));

    pending.forEach(event -> {
      kafkaTemplate.send(event.getTopic(), event.getAggregateId(), event.getPayload())
          .thenAccept(r -> {
            event.setPublishedAt(Instant.now());
            outboxRepository.save(event);
            log.info("Outbox published: id={} type={}", event.getId(), event.getEventType());
          })
          .exceptionally(ex -> {
            log.error("Outbox publish failed: id={}", event.getId(), ex);
            return null;
          });
    });
  }
}
```

---

## pom.xml

```xml
<dependency>
  <groupId>org.springframework.kafka</groupId>
  <artifactId>spring-kafka</artifactId>
  <!-- version managed by Spring Boot BOM -->
</dependency>

<!-- For testing -->
<dependency>
  <groupId>org.springframework.kafka</groupId>
  <artifactId>spring-kafka-test</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>kafka</artifactId>
  <scope>test</scope>
</dependency>
```

---

## application.yml

```yaml
spring:
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS}

    # Producer — production settings
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all                          # wait for all replicas — never 0 or 1
      retries: 3
      properties:
        enable.idempotence: true         # prevent duplicate messages on retry
        max.in.flight.requests.per.connection: 1  # required for idempotence
        delivery.timeout.ms: 120000      # 2 min total delivery timeout

    # Consumer
    consumer:
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      auto-offset-reset: earliest
      enable-auto-commit: false          # NEVER auto-commit — use manual ack
      properties:
        spring.json.trusted.packages: "com.nmn.*"  # NEVER use *
        isolation.level: read_committed  # read only committed messages (transactions)

    # Listener
    listener:
      ack-mode: RECORD                   # ack after each record is processed
      concurrency: 3                     # number of consumer threads per listener

app:
  kafka:
    group-id: ${KAFKA_CONSUMER_GROUP_ID:myservice-consumer-group}
```

---

## Config bean

```java
// config/KafkaConfig.java
@Configuration
@EnableKafka
public class KafkaConfig {

  /**
   * Custom error handler — logs dead letter events and continues.
   * Works alongside @RetryableTopic for fine-grained control.
   */
  @Bean
  public DefaultErrorHandler kafkaErrorHandler() {
    // Exponential backoff: 1s → 2s → 4s → 8s
    ExponentialBackOffWithMaxRetries backOff =
        new ExponentialBackOffWithMaxRetries(3);
    backOff.setInitialInterval(1_000);
    backOff.setMultiplier(2.0);
    backOff.setMaxInterval(30_000);

    DefaultErrorHandler handler = new DefaultErrorHandler(
        new DeadLetterPublishingRecoverer(kafkaTemplate()),
        backOff
    );

    // Do NOT retry on validation errors — they will never succeed
    handler.addNotRetryableExceptions(
        ValidationException.class,
        DeserializationException.class
    );

    return handler;
  }
}
```

---

## Testing

```java
// event/consumer/OrderEventConsumerTest.java — Testcontainers Kafka
@SpringBootTest
@Testcontainers
@Slf4j
class OrderEventConsumerTest {

  @Container
  static KafkaContainer kafka = new KafkaContainer(
      DockerImageName.parse("confluentinc/cp-kafka:7.6.0"));

  @DynamicPropertySource
  static void kafkaProps(DynamicPropertyRegistry registry) {
    registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
  }

  @Autowired
  private KafkaTemplate<String, OrderCompletedEvent> kafkaTemplate;

  @MockBean
  private NotificationService notificationService;

  @Test
  void handleOrderCompleted_sendsNotification() throws InterruptedException {
    OrderCompletedEvent event = new OrderCompletedEvent(
        "order-123", "customer-456", "99.99",
        "INR", "COMPLETED", Instant.now(), UUID.randomUUID().toString()
    );

    kafkaTemplate.send("order.completed", event.orderId(), event);

    await().atMost(10, TimeUnit.SECONDS)
        .untilAsserted(() ->
            verify(notificationService).sendOrderConfirmation("customer-456", "order-123"));
  }
}

// Unit test — test consumer logic without Kafka
@ExtendWith(MockitoExtension.class)
class OrderEventConsumerUnitTest {

  @Mock  private NotificationService notificationService;
  @InjectMocks private OrderEventConsumer consumer;

  @Test
  void handleOrderCompleted_callsNotificationService() {
    OrderCompletedEvent event = new OrderCompletedEvent(
        "order-123", "customer-456", "99.99",
        "INR", "COMPLETED", Instant.now(), "req-id-1"
    );

    consumer.handleOrderCompleted(event, "order.completed", 0, 0L);

    then(notificationService).should().sendOrderConfirmation("customer-456", "order-123");
  }
}
```

---

## Reference files — load only when relevant

| File | Load when |
|------|-----------|
| `skills/common/code-style.md` | Any Java code generation |
| `skills/common/error-handling.md` | Consumer error handling, DLT handler |
| `skills/common/logging.md` | MDC in consumers, structured event logging |
| `skills/common/testing.md` | Testcontainers Kafka, @EmbeddedKafka, StepVerifier |
| `skills/common/observability.md` | Micrometer Kafka metrics, OTel tracing |
| `skills/common/microservices.md` | Saga pattern, event-driven architecture, outbox pattern |
| `skills/common/data-migrations.md` | Flyway migration for outbox_events table |
| `skills/common/security.md` | Kafka SSL/TLS config, SASL authentication |
| `skills/common/deployment.md` | Docker Compose Kafka setup for local dev |

---

## Behaviour notes

- Always confirm whether the user needs the outbox pattern — ask if they need guaranteed delivery
- Always ask for the event name and topic name before generating — these are the contract
- Never hardcode the consumer group ID — always from `${app.kafka.group-id}`
- Default to `acks=all` + `enable.idempotence=true` for producers — state this assumption
- Remind the user to create topics in infrastructure (Terraform/Helm) — not in application code (`autoCreateTopics = "false"`)
- For the outbox pattern, generate the Flyway migration for `outbox_events` table alongside the code
- Always add a `@DltHandler` alongside every `@RetryableTopic` consumer
- For any consumer handling financial events, recommend the outbox pattern over direct publish
