package io.rydata.platform.financing.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;

public final class ProblemResponses {

    private ProblemResponses() {
    }

    public static void write(
            JsonMapper jsonMapper,
            HttpServletResponse response,
            HttpStatus status,
            String errorCode,
            String detail,
            String typeBase) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        jsonMapper.writeValue(response.getOutputStream(), Map.of(
                "type", typeBase + errorCode.toLowerCase(Locale.ROOT),
                "title", status.getReasonPhrase(),
                "status", status.value(),
                "detail", detail,
                "errorCode", errorCode,
                "timestamp", Instant.now().toString()));
    }
}
