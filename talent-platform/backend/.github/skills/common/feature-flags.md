# Feature Flags — Enterprise Standard

**Applies to:** All Java Spring Boot services releasing features incrementally.
**Tools:** LaunchDarkly, Unleash, Flagsmith, OpenFeature (`openfeature/java-sdk`), or a custom implementation.

---

## SECTION 1 — FLAG TYPES

| Type | Purpose | Lifetime | Example |
|------|---------|----------|---------|
| Release flag | Gradual rollout of new feature | Days to weeks | `enable_new_checkout` |
| Experiment flag | A/B test | Weeks | `experiment_pricing_v2` |
| Ops flag | Kill switch for degraded mode | Permanent | `disable_external_payments` |
| Permission flag | Feature gating per plan/tier | Permanent | `feature_advanced_analytics` |

---

## SECTION 2 — IMPLEMENTATION PATTERN

### Flag Service Interface

```java
// src/main/java/com/nmn/app/core/flags/FeatureFlags.java
package com.nmn.app.core.flags;

/**
 * Evaluates feature flags for a given user context.
 *
 * <p>The interface allows tests to swap in a {@link StubFeatureFlags} without
 * starting a real flag provider.
 */
public interface FeatureFlags {

    /**
     * Returns true if the flag is enabled for the given user.
     *
     * @param flag   the flag name
     * @param userId the user identifier used for consistent hashing
     * @return true if the feature is enabled for this user
     */
    boolean isEnabled(String flag, String userId);
}
```

### Local / Rollout Implementation

```java
// src/main/java/com/nmn/app/core/flags/LocalFeatureFlags.java
package com.nmn.app.core.flags;

import org.springframework.stereotype.Component;

import java.nio.ByteBuffer;
import java.security.MessageDigest;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Feature flag implementation backed by a static rollout percentage map.
 *
 * <p>Use this in local/staging environments. Production should use
 * {@link OpenFeatureFlags} pointing at LaunchDarkly or Unleash.
 *
 * <p>Uses deterministic MD5 hashing so the same user always receives the
 * same variant for a given flag — consistent experience across requests.
 */
@Component
public class LocalFeatureFlags implements FeatureFlags {

    // flag name → rollout percentage (0..100)
    private final Map<String, Integer> rollout;

    // test-only overrides — never set in production code
    private final Map<String, Boolean> overrides = new ConcurrentHashMap<>();

    public LocalFeatureFlags(Map<String, Integer> rollout) {
        this.rollout = Map.copyOf(rollout);
    }

    @Override
    public boolean isEnabled(String flag, String userId) {
        // Test overrides take priority
        if (overrides.containsKey(flag)) {
            return overrides.get(flag);
        }

        int pct = rollout.getOrDefault(flag, 0);
        if (pct <= 0)   return false;
        if (pct >= 100) return true;

        return hashToPercent(flag + ":" + userId) < pct;
    }

    /** For use in tests only — never call from production code. */
    public void setOverride(String flag, boolean enabled) {
        overrides.put(flag, enabled);
    }

    /** Clears all test overrides. */
    public void clearOverrides() {
        overrides.clear();
    }

    /** Maps a key to 0..99 deterministically using MD5. */
    private static int hashToPercent(String key) {
        try {
            byte[] digest = MessageDigest.getInstance("MD5").digest(key.getBytes());
            long value = ByteBuffer.wrap(digest, 0, 4).getInt() & 0xFFFFFFFFL;
            return (int) (value % 100);
        } catch (Exception ex) {
            throw new IllegalStateException("MD5 not available", ex);
        }
    }
}
```

### Spring Configuration

```java
// src/main/java/com/nmn/app/core/flags/FlagConfig.java
package com.nmn.app.core.flags;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

import java.util.Map;

@Configuration
public class FlagConfig {

    @Bean
    public LocalFeatureFlags featureFlags(FlagProperties properties) {
        return new LocalFeatureFlags(properties.rollout());
    }
}

@Validated
@ConfigurationProperties(prefix = "feature-flags")
public record FlagProperties(
    Map<String, Integer> rollout   // flag-name → rollout percentage
) {}
```

```yaml
# application.yml
feature-flags:
  rollout:
    enable_new_checkout: 0           # 0% — off by default
    experiment_pricing_v2: 10        # 10% of users
    disable_external_payments: 0
    feature_advanced_analytics: 100  # 100% — fully enabled
```

### Usage in Service Layer

```java
// In service layer — never read flags in repository or model layer
@Service
public class PricingService {

    private final LegacyPricingEngine   legacy;
    private final NewPricingEngine      newEngine;
    private final FeatureFlags          flags;

    public PricingService(LegacyPricingEngine legacy,
                          NewPricingEngine newEngine,
                          FeatureFlags flags) {
        this.legacy    = legacy;
        this.newEngine = newEngine;
        this.flags     = flags;
    }

    public PricingResponse get(Long productId, String userId) {
        if (flags.isEnabled("experiment_pricing_v2", userId)) {
            return newEngine.calculate(productId);
        }
        return legacy.calculate(productId);
    }
}
```

### Usage in Controllers

```java
@RestController
@RequestMapping("/api/v1")
public class DashboardController {

    private final DashboardService dashboardService;
    private final FeatureFlags     flags;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard(
            @AuthenticationPrincipal UserPrincipal principal) {

        String userId = principal.getUserId().toString();
        DashboardResponse data = dashboardService.getBase(principal.getUserId());

        if (flags.isEnabled("feature_advanced_analytics", userId)) {
            data.setAnalytics(dashboardService.getAdvanced(principal.getUserId()));
        }

        return ResponseEntity.ok(data);
    }
}
```

---

## SECTION 3 — GRADUAL ROLLOUT STRATEGY

```
Day 1:   1%  (internal team only)
Day 3:   5%  (early adopters / beta users)
Day 5:  25%  (monitor error rates, latency)
Day 7:  50%  (watch for edge cases at scale)
Day 10: 100% (full rollout)
Day 14: Remove flag (cleanup)
```

### Rollout Rules

| Rule | Rationale |
|------|-----------|
| Monitor error rate at each stage before increasing | Catch issues early |
| Have a kill switch — set rollout to 0% instantly | Faster than a code revert or redeployment |
| Use deterministic hashing | Same user gets a consistent experience across requests |
| Log which variant a user received | Enables per-variant debugging |
| Never nest flags | Combinatorial explosion — unreadable and untestable |

---

## SECTION 4 — FLAG LIFECYCLE

```
CREATED → ACTIVE → ROLLED_OUT → CLEANUP → REMOVED
```

| Phase | Action | Owner |
|-------|--------|-------|
| Created | Flag added to code + `application.yml` config | Developer |
| Active | Gradual rollout in progress | Developer + PM |
| Rolled out | 100% enabled, monitoring stable | Developer |
| Cleanup | Remove flag checks from code; open PR | Developer (scheduled) |
| Removed | Flag deleted from config and `FlagRegistry` | Developer |

### Cleanup Rules

- **Release flags:** remove within 2 weeks of 100% rollout.
- **Experiment flags:** remove within 1 week of experiment conclusion.
- **Ops flags:** keep permanently (kill switches).
- **Permission flags:** keep permanently (business logic).

**Anti-pattern:** flags that live for months. They become tech debt, make code harder to read, and increase test matrix size.

---

## SECTION 5 — TESTING WITH FLAGS

```java
// src/test/java/com/nmn/app/service/PricingServiceTest.java
@ExtendWith(MockitoExtension.class)
class PricingServiceTest {

    private LocalFeatureFlags flags;
    private PricingService    pricingService;

    @BeforeEach
    void setUp() {
        flags         = new LocalFeatureFlags(Map.of());   // all flags off by default
        pricingService = new PricingService(legacy, newEngine, flags);
    }

    @AfterEach
    void tearDown() {
        flags.clearOverrides();   // always clear — prevents test pollution
    }

    @Test
    @DisplayName("uses new pricing engine when experiment flag is enabled")
    void get_whenExperimentFlagEnabled_usesNewEngine() {
        flags.setOverride("experiment_pricing_v2", true);

        PricingResponse result = pricingService.get(1L, "user-1");

        assertThat(result.getEngine()).isEqualTo("v2");
    }

    @Test
    @DisplayName("uses legacy engine when experiment flag is disabled")
    void get_whenExperimentFlagDisabled_usesLegacyEngine() {
        flags.setOverride("experiment_pricing_v2", false);

        PricingResponse result = pricingService.get(1L, "user-1");

        assertThat(result.getEngine()).isEqualTo("legacy");
    }
}
```

**Stub for integration tests:**

```java
// src/test/java/com/nmn/app/core/flags/StubFeatureFlags.java
public class StubFeatureFlags implements FeatureFlags {

    private final Map<String, Boolean> overrides = new HashMap<>();

    public StubFeatureFlags enable(String flag)  { overrides.put(flag, true);  return this; }
    public StubFeatureFlags disable(String flag) { overrides.put(flag, false); return this; }

    @Override
    public boolean isEnabled(String flag, String userId) {
        return overrides.getOrDefault(flag, false);
    }
}

// Usage in @SpringBootTest — replace real bean with stub
@TestConfiguration
public class FlagTestConfig {
    @Bean
    @Primary
    public FeatureFlags featureFlags() {
        return new StubFeatureFlags()
            .enable("feature_advanced_analytics")
            .disable("experiment_pricing_v2");
    }
}
```

---

## SECTION 6 — FLAG HYGIENE TRACKING

Maintain a flag registry as a constant file — reviewed monthly for cleanup candidates:

```java
// src/main/java/com/nmn/app/core/flags/FlagRegistry.java
package com.nmn.app.core.flags;

/**
 * Active feature flags — review monthly for cleanup candidates.
 *
 * <table>
 *   <tr><th>Flag</th><th>Type</th><th>Owner</th><th>Created</th><th>Target removal</th></tr>
 *   <tr><td>enable_new_checkout</td><td>release</td><td>@arpit</td><td>2026-04-01</td><td>2026-04-15</td></tr>
 *   <tr><td>experiment_pricing_v2</td><td>experiment</td><td>@nishant</td><td>2026-04-10</td><td>2026-05-01</td></tr>
 *   <tr><td>disable_external_payments</td><td>ops</td><td>@deepika</td><td>2026-01-01</td><td>permanent</td></tr>
 *   <tr><td>feature_advanced_analytics</td><td>permission</td><td>@arpit</td><td>2026-03-01</td><td>permanent</td></tr>
 * </table>
 */
public final class FlagRegistry {

    private FlagRegistry() {}

    // Release flags
    public static final String ENABLE_NEW_CHECKOUT          = "enable_new_checkout";

    // Experiment flags
    public static final String EXPERIMENT_PRICING_V2        = "experiment_pricing_v2";

    // Ops flags (permanent)
    public static final String DISABLE_EXTERNAL_PAYMENTS    = "disable_external_payments";

    // Permission flags (permanent)
    public static final String FEATURE_ADVANCED_ANALYTICS   = "feature_advanced_analytics";
}
```

Use constants from `FlagRegistry` in all flag checks — avoids string typos and makes cleanup grep-trivial:

```java
// ✅ CORRECT — typo-safe, grep-friendly
if (flags.isEnabled(FlagRegistry.EXPERIMENT_PRICING_V2, userId)) { ... }

// ❌ WRONG — raw string; typos won't compile-fail
if (flags.isEnabled("experiment_priicing_v2", userId)) { ... }
```

---

## SECTION 7 — OPENFEATURE INTEGRATION (recommended for production)

```xml
<!-- pom.xml -->
<dependency>
  <groupId>dev.openfeature</groupId>
  <artifactId>sdk</artifactId>
  <version>1.7.0</version>
</dependency>
<!-- Provider: LaunchDarkly, Unleash, flagd, etc. -->
<dependency>
  <groupId>dev.openfeature.contrib.providers</groupId>
  <artifactId>flagd</artifactId>
  <version>0.8.9</version>
</dependency>
```

```java
// src/main/java/com/nmn/app/core/flags/OpenFeatureFlags.java
package com.nmn.app.core.flags;

import dev.openfeature.sdk.*;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Production feature flag implementation backed by OpenFeature.
 *
 * <p>Swap the provider (flagd → LaunchDarkly → Unleash) without any code
 * changes — only the provider bean changes.
 */
@Component
@Profile("!local")    // use LocalFeatureFlags in local profile
public class OpenFeatureFlags implements FeatureFlags {

    private final Client client;

    public OpenFeatureFlags(OpenFeatureAPI openFeature) {
        this.client = openFeature.getClient("my-service");
    }

    @Override
    public boolean isEnabled(String flag, String userId) {
        EvaluationContext ctx = new ImmutableContext(userId);
        return client.getBooleanValue(flag, false, ctx);
    }
}
```

```java
// src/main/java/com/nmn/app/config/OpenFeatureConfig.java
@Configuration
@Profile("!local")
public class OpenFeatureConfig {

    @Bean
    public OpenFeatureAPI openFeatureAPI(FlagdProvider provider) {
        OpenFeatureAPI api = OpenFeatureAPI.getInstance();
        api.setProvider(provider);
        return api;
    }

    @Bean
    public FlagdProvider flagdProvider() {
        return new FlagdProvider(FlagdOptions.builder()
                .host("flagd-service")
                .port(8013)
                .build());
    }
}
```

OpenFeature lets you swap providers (LaunchDarkly ↔ Unleash ↔ flagd) without any application code changes — only the Spring `@Bean` configuration changes.
