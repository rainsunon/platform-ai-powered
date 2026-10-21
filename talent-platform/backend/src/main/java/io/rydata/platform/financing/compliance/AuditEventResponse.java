package io.rydata.platform.financing.compliance;

import org.jspecify.annotations.Nullable;

import java.util.List;

public record AuditEventResponse(
        String id,
        String timestamp,
        String actor,
        String role,
        String action,
        String category,
        String entity,
        String targetRef,
        String hash,
        String severity,
        @Nullable String details,
        @Nullable String ipAddress,
        List<AuditDeltaResponse> delta,
        boolean verified
) {
    public static AuditEventResponse from(AuditEvent event) {
        return new AuditEventResponse(
                event.getId(),
                event.getOccurredAt(),
                event.getActor(),
                event.getRoleLabel(),
                event.getActionName(),
                event.getCategory().wire(),
                event.getEntityName(),
                event.getTargetRef(),
                event.getContentHash(),
                event.getSeverity().wire(),
                event.getDetails(),
                event.getIpAddress(),
                event.getDeltas().stream().map(AuditDeltaResponse::from).toList(),
                event.isVerified());
    }
}
