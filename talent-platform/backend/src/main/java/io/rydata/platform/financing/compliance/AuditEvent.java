package io.rydata.platform.financing.compliance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "audit_event", indexes = {
        @Index(name = "idx_audit_event_created", columnList = "created_at"),
        @Index(name = "idx_audit_event_severity", columnList = "severity")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AuditEvent {

    @Id
    @Column(nullable = false, updatable = false, length = 64)
    private String id;

    @Column(name = "occurred_at", nullable = false, length = 40)
    private String occurredAt;

    @Column(nullable = false)
    private String actor;

    @Column(name = "role_label", nullable = false, length = 64)
    private String roleLabel;

    @Column(name = "action_name", nullable = false, length = 64)
    private String actionName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AuditCategory category;

    @Column(name = "entity_name", nullable = false)
    private String entityName;

    @Column(name = "target_ref", nullable = false, length = 512)
    private String targetRef;

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private AuditSeverity severity;

    @Column(length = 2000)
    private @Nullable String details;

    @Column(name = "ip_address")
    private @Nullable String ipAddress;

    @Column(nullable = false)
    private boolean verified;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "delta", nullable = false)
    private List<AuditDelta> deltas = new ArrayList<>();

    public static AuditEvent record(
            String id,
            String occurredAt,
            String actor,
            String roleLabel,
            String actionName,
            AuditCategory category,
            String entityName,
            String targetRef,
            String contentHash,
            AuditSeverity severity,
            @Nullable String details,
            @Nullable String ipAddress,
            List<AuditDelta> deltas,
            Instant createdAt) {
        AuditEvent event = new AuditEvent();
        event.id = id;
        event.occurredAt = occurredAt;
        event.actor = actor;
        event.roleLabel = roleLabel;
        event.actionName = actionName;
        event.category = category;
        event.entityName = entityName;
        event.targetRef = targetRef;
        event.contentHash = contentHash;
        event.severity = severity;
        event.details = details;
        event.ipAddress = ipAddress;
        event.verified = true;
        event.createdAt = createdAt;
        event.deltas.addAll(deltas);
        return event;
    }
}
