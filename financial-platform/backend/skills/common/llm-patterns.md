# LLM / AI Application Patterns — Enterprise Standard

**Applies to:** Java Spring Boot projects building on top of LLMs (OpenAI, Anthropic, Gemini, local models).

---

## SECTION 1 — PROJECT STRUCTURE FOR LLM APPLICATIONS

```
my-llm-app/
├── src/main/java/com/nmn/llmapp/
│   ├── Application.java
│   │
│   ├── prompt/                         ← prompt templates — version controlled, never inline String.format
│   │   ├── PromptTemplate.java         ← Template interface
│   │   ├── RenderedPrompt.java         ← output record
│   │   ├── SummarisationPrompt.java
│   │   ├── ExtractionPrompt.java
│   │   └── ClassificationPrompt.java
│   │
│   ├── llm/                            ← provider abstractions
│   │   ├── LlmClient.java              ← Client interface
│   │   ├── LlmResponse.java            ← normalised response record
│   │   ├── LlmOptions.java             ← generation options record
│   │   ├── AnthropicClient.java
│   │   ├── OpenAiClient.java
│   │   └── LlmClientFactory.java       ← builds correct client from config
│   │
│   ├── context/                        ← conversation + RAG context
│   │   ├── ConversationHistory.java
│   │   └── ContextRetriever.java
│   │
│   ├── pipeline/                       ← orchestrated multi-step LLM workflows
│   │   ├── SummarisePipeline.java
│   │   └── ExtractionPipeline.java
│   │
│   └── core/
│       ├── config/
│       │   └── LlmProperties.java      ← @ConfigurationProperties for API keys, models, limits
│       └── tracking/
│           └── LlmUsageTracker.java    ← token usage + cost logging
│
└── src/main/resources/
    ├── application.yml
    └── prompts/                        ← externalised prompt text files (optional)
        ├── summarisation-system.txt
        └── extraction-system.txt
```

---

## SECTION 2 — PROMPT MANAGEMENT

Prompts are code. Version-control them. Never inline them as `String.format` scattered through business logic.

```java
// src/main/java/com/nmn/llmapp/prompt/RenderedPrompt.java
package com.nmn.llmapp.prompt;

// Immutable output of rendering a PromptTemplate.
public record RenderedPrompt(
    String system,
    String user,
    String version
) {}
```

```java
// src/main/java/com/nmn/llmapp/prompt/PromptTemplate.java
package com.nmn.llmapp.prompt;

// Builds a RenderedPrompt from typed input.
// All implementations must be stateless and thread-safe.
public interface PromptTemplate<T> {
    RenderedPrompt render(T input);
}
```

```java
// src/main/java/com/nmn/llmapp/prompt/SummarisationPrompt.java
package com.nmn.llmapp.prompt;

import org.springframework.stereotype.Component;
import org.springframework.util.Assert;

/**
 * Prompt template for document summarisation.
 *
 * <p>Version history:
 * <ul>
 *   <li>1.0.0 — initial
 *   <li>1.1.0 — added language constraint
 *   <li>1.2.0 — added length control
 * </ul>
 */
@Component
public class SummarisationPrompt implements PromptTemplate<SummarisationPrompt.Input> {

    private static final String VERSION        = "1.2.0";
    private static final int    DEFAULT_SENTENCES = 5;
    private static final String DEFAULT_LANGUAGE  = "English";

    /**
     * Typed input for the summarisation prompt.
     *
     * @param document     the document to summarise; must not be blank
     * @param maxSentences max sentences in the output; defaults to 5 if zero
     * @param language     output language; defaults to English if null
     */
    public record Input(String document, int maxSentences, String language) {

        public Input {
            Assert.hasText(document, "document must not be blank");
            if (maxSentences <= 0) maxSentences = DEFAULT_SENTENCES;
            if (language == null || language.isBlank()) language = DEFAULT_LANGUAGE;
        }

        // Convenience constructor — uses defaults for maxSentences and language
        public Input(String document) {
            this(document, DEFAULT_SENTENCES, DEFAULT_LANGUAGE);
        }
    }

    @Override
    public RenderedPrompt render(Input input) {
        String system = """
            You are a professional document summariser.
            Always respond in %s.
            Never include information not present in the source document.
            """.formatted(input.language());

        String user = """
            Summarise the following document in %d sentences or fewer.

            DOCUMENT:
            %s
            """.formatted(input.maxSentences(), input.document());

        return new RenderedPrompt(system, user, VERSION);
    }
}
```

---

## SECTION 3 — LLM CLIENT ABSTRACTION

Never call provider SDKs directly in business code. Wrap behind an interface so providers are swappable and testable.

```java
// src/main/java/com/nmn/llmapp/llm/LlmResponse.java
package com.nmn.llmapp.llm;

// Normalised output of any LLM call — provider-agnostic.
public record LlmResponse(
    String content,
    String model,
    int promptTokens,
    int completionTokens,
    String finishReason
) {
    public int totalTokens() { return promptTokens + completionTokens; }
}
```

```java
// src/main/java/com/nmn/llmapp/llm/LlmOptions.java
package com.nmn.llmapp.llm;

// Generation options — all fields optional; defaults applied per provider.
public record LlmOptions(
    Float temperature,
    Integer maxTokens,
    String model          // overrides the client's default model when set
) {
    public static LlmOptions defaults() { return new LlmOptions(null, null, null); }

    public static LlmOptions forExtraction() { return new LlmOptions(0.0f, 1024, null); }
}
```

```java
// src/main/java/com/nmn/llmapp/llm/LlmClient.java
package com.nmn.llmapp.llm;

// Provider abstraction — all implementations must be thread-safe.
public interface LlmClient {

    /**
     * Sends a single-turn message and returns the normalised response.
     *
     * @param system  the system prompt
     * @param user    the user message
     * @param options generation options
     * @return the LLM response
     * @throws LlmException on provider error, timeout, or rate limit
     */
    LlmResponse complete(String system, String user, LlmOptions options);
}
```

```java
// src/main/java/com/nmn/llmapp/llm/AnthropicClient.java
package com.nmn.llmapp.llm;

import com.anthropic.client.Anthropic;
import com.anthropic.models.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * LlmClient implementation for the Anthropic Claude API.
 */
@Slf4j
@Component
public class AnthropicClient implements LlmClient {

    private static final int DEFAULT_MAX_TOKENS = 1024;

    private final Anthropic anthropic;
    private final String    defaultModel;

    public AnthropicClient(LlmProperties props) {
        this.anthropic    = Anthropic.builder().apiKey(props.anthropic().apiKey()).build();
        this.defaultModel = props.anthropic().defaultModel();
    }

    @Override
    public LlmResponse complete(String system, String user, LlmOptions options) {
        String  model     = options.model()     != null ? options.model()     : defaultModel;
        int     maxTokens = options.maxTokens() != null ? options.maxTokens() : DEFAULT_MAX_TOKENS;
        float   temp      = options.temperature() != null ? options.temperature() : 0.7f;

        try {
            Message response = anthropic.messages().create(
                MessageCreateParams.builder()
                    .model(model)
                    .maxTokens(maxTokens)
                    .temperature(temp)
                    .system(system)
                    .messages(List.of(
                        MessageParam.builder()
                            .role(MessageParam.Role.USER)
                            .content(user)
                            .build()
                    ))
                    .build()
            );

            String content = response.content().stream()
                    .filter(b -> b instanceof ContentBlock.Text)
                    .map(b -> ((ContentBlock.Text) b).text())
                    .reduce("", String::concat);

            LlmResponse result = new LlmResponse(
                content,
                response.model(),
                (int) response.usage().inputTokens(),
                (int) response.usage().outputTokens(),
                response.stopReason().toString()
            );

            log.debug("llm_completed provider=anthropic model={} prompt_tokens={} completion_tokens={}",
                model, result.promptTokens(), result.completionTokens());

            return result;

        } catch (Exception ex) {
            throw new LlmException("Anthropic API call failed: " + ex.getMessage(), ex);
        }
    }
}
```

```java
// src/main/java/com/nmn/llmapp/core/config/LlmProperties.java
package com.nmn.llmapp.core.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "llm")
public record LlmProperties(
    Anthropic anthropic,
    OpenAi    openai,
    Limits    limits
) {
    public record Anthropic(
        @NotBlank String apiKey,
        @NotBlank String defaultModel    // e.g. "claude-sonnet-4-20250514"
    ) {}

    public record OpenAi(
        @NotBlank String apiKey,
        @NotBlank String defaultModel    // e.g. "gpt-4o"
    ) {}

    public record Limits(
        int tokensPerTenantPerHour,      // per-tenant rate limit
        int maxContextTokens             // max tokens per request
    ) {}
}
```

---

## SECTION 4 — CONVERSATION & CONTEXT MANAGEMENT

```java
// src/main/java/com/nmn/llmapp/context/ConversationHistory.java
package com.nmn.llmapp.context;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Bounded conversation history for multi-turn LLM interactions.
 *
 * <p>{@code maxTurns} caps the number of complete user+assistant pairs retained.
 * Oldest messages are evicted automatically when the limit is exceeded.
 */
public class ConversationHistory {

    // One turn = one user message + one assistant message.
    public record Message(String role, String content) {
        public static Message user(String content)      { return new Message("user",      content); }
        public static Message assistant(String content) { return new Message("assistant", content); }
    }

    private final int           maxMessages;   // maxTurns × 2
    private final List<Message> messages = new ArrayList<>();

    public ConversationHistory(int maxTurns) {
        this.maxMessages = maxTurns * 2;
    }

    /** Appends a user turn. */
    public void addUser(String content) { add(Message.user(content)); }

    /** Appends an assistant turn. */
    public void addAssistant(String content) { add(Message.assistant(content)); }

    private void add(Message message) {
        messages.add(message);
        if (messages.size() > maxMessages) {
            messages.subList(0, messages.size() - maxMessages).clear();
        }
    }

    /** Returns an unmodifiable snapshot of current messages. */
    public List<Message> toApiFormat() {
        return Collections.unmodifiableList(new ArrayList<>(messages));
    }

    /** Clears all messages. */
    public void clear() { messages.clear(); }

    /** Returns the number of completed turns (user + assistant pairs). */
    public int turns() { return messages.size() / 2; }
}
```

---

## SECTION 5 — STRUCTURED OUTPUT / JSON EXTRACTION

Always validate LLM JSON output with a typed class and Bean Validation. Never trust freeform strings.

```java
// src/main/java/com/nmn/llmapp/pipeline/ExtractionPipeline.java
package com.nmn.llmapp.pipeline;

import com.nmn.llmapp.llm.LlmClient;
import com.nmn.llmapp.llm.LlmOptions;
import com.nmn.llmapp.prompt.ExtractionPrompt;
import com.nmn.llmapp.prompt.RenderedPrompt;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class ExtractionPipeline {

    // Typed output expected from extraction prompts — validated after parsing
    public record ExtractedEntity(
        @NotBlank  String name,
        @NotBlank  String entityType,
        @DecimalMin("0.0") @DecimalMax("1.0") double confidence,
        String context   // optional
    ) {}

    private record ExtractionResult(List<ExtractedEntity> entities) {}

    private final LlmClient        llmClient;
    private final ExtractionPrompt prompt;
    private final ObjectMapper     objectMapper;

    public ExtractionPipeline(LlmClient llmClient, ExtractionPrompt prompt, ObjectMapper objectMapper) {
        this.llmClient    = llmClient;
        this.prompt       = prompt;
        this.objectMapper = objectMapper;
    }

    /**
     * Extracts structured entities from the given text using the configured LLM.
     *
     * @param text the text to extract entities from
     * @return list of validated extracted entities
     * @throws LlmParseException if the LLM response cannot be parsed into the expected structure
     */
    public List<ExtractedEntity> extract(String text) {
        RenderedPrompt rendered = prompt.render(new ExtractionPrompt.Input(text));

        var response = llmClient.complete(
            rendered.system(),
            rendered.user(),
            LlmOptions.forExtraction()   // temperature=0.0 for deterministic extraction
        );

        try {
            ExtractionResult result = objectMapper.readValue(response.content(), ExtractionResult.class);
            return result.entities();
        } catch (Exception ex) {
            log.error("llm_parse_failed model={} finish_reason={} error={}",
                response.model(), response.finishReason(), ex.getMessage(), ex);
            throw new LlmParseException("Failed to parse LLM extraction output", ex);
        }
    }
}
```

For providers that support **tool use / function calling / structured output JSON schema**, prefer those native features over freeform-then-parse.

---

## SECTION 6 — COST AND RATE LIMIT MANAGEMENT

```java
// src/main/java/com/nmn/llmapp/core/tracking/LlmUsageTracker.java
package com.nmn.llmapp.core.tracking;

import com.nmn.llmapp.llm.LlmClient;
import com.nmn.llmapp.llm.LlmOptions;
import com.nmn.llmapp.llm.LlmResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Wraps LLM calls with token usage logging and per-tenant rate limiting.
 *
 * <p>All production LLM calls MUST go through this wrapper so per-tenant
 * cost dashboards remain accurate.
 */
@Slf4j
@Component
public class LlmUsageTracker {

    private final LlmClient          llmClient;
    private final StringRedisTemplate redis;

    public LlmUsageTracker(LlmClient llmClient, StringRedisTemplate redis) {
        this.llmClient = llmClient;
        this.redis     = redis;
    }

    /**
     * Executes an LLM call and logs token usage for cost tracking.
     *
     * @param system    system prompt
     * @param user      user message
     * @param operation logical operation name for cost dashboards (e.g. "summarise", "extract")
     * @param tenantId  tenant performing the call
     * @param options   generation options
     * @return the LLM response
     */
    public LlmResponse completeWithTracking(
            String system, String user, String operation, Long tenantId, LlmOptions options) {

        LlmResponse response = llmClient.complete(system, user, options);

        log.info("llm_call_completed operation={} tenant_id={} model={} prompt_tokens={} " +
                 "completion_tokens={} total_tokens={} finish_reason={}",
            operation, tenantId, response.model(),
            response.promptTokens(), response.completionTokens(), response.totalTokens(),
            response.finishReason());

        return response;
    }

    /**
     * Checks and increments the per-tenant hourly token quota via Redis.
     *
     * @param tenantId   the tenant to check
     * @param perHour    max LLM calls allowed per hour
     * @throws RateLimitException if the quota is exceeded
     */
    public void checkLlmQuota(Long tenantId, long perHour) {
        String key   = "llm:quota:" + tenantId;
        Long   count = redis.opsForValue().increment(key);

        if (count != null && count == 1) {
            redis.expire(key, Duration.ofHours(1));
        }

        if (count != null && count > perHour) {
            throw new RateLimitException(
                "LLM quota exceeded for tenant " + tenantId + ". Limit: " + perHour + "/hour");
        }
    }
}
```

---

## SECTION 7 — RULES SUMMARY

- Never call provider SDKs from business code — always go through the `LlmClient` interface.
- Prompts are typed `PromptTemplate` implementations, not inline `String.format` calls.
- Always parse and validate LLM output with typed records/classes and Bean Validation.
- Log token usage on every call — cost monitoring depends on it.
- Per-tenant rate limit at the gateway and at the application layer (Redis token bucket).
- Stream responses where the provider supports it for long generations — use `Flux<String>` in WebFlux or Server-Sent Events in MVC.
- Temperature `0.0f` for extraction and classification; higher values only for generation tasks.
- Never log full prompts or completions if they may contain PII — log metadata only (model, token counts, finish reason).
- Store API keys in `@ConfigurationProperties` loaded from environment variables — never hardcode.
- Inject `LlmClient` as a Spring bean — mock it in tests with a `FakeLlmClient` returning canned responses.
