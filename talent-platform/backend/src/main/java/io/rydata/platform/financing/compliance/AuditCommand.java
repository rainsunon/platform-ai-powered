package io.rydata.platform.financing.compliance;

import org.jspecify.annotations.Nullable;

import java.util.List;

public record AuditCommand(
        String action,
        AuditCategory category,
        String entity,
        String targetRef,
        AuditSeverity severity,
        @Nullable String details,
        List<AuditDeltaResponse> deltas
) {
}
