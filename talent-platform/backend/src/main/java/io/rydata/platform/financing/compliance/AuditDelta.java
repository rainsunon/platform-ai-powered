package io.rydata.platform.financing.compliance;

import org.jspecify.annotations.Nullable;

/**
 * The fields that change depend on the action, so each audit event stores its
 * deltas as one jsonb document.
 */
public record AuditDelta(
        String fieldName,
        @Nullable String previousValue,
        @Nullable String currentValue
) {
    public static AuditDelta of(String fieldName, @Nullable String previousValue, @Nullable String currentValue) {
        return new AuditDelta(fieldName, previousValue, currentValue);
    }
}
