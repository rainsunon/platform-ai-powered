package io.rydata.platform.financing.compliance;

import org.jspecify.annotations.Nullable;

public record AuditDeltaResponse(String field, @Nullable String previous, @Nullable String current) {

    public static AuditDeltaResponse from(AuditDelta delta) {
        return new AuditDeltaResponse(delta.fieldName(), delta.previousValue(), delta.currentValue());
    }
}
