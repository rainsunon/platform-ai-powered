package io.rydata.platform.financing.compliance;

import io.rydata.platform.financing.common.AuditHash;
import io.rydata.platform.financing.common.BusinessIds;
import io.rydata.platform.financing.common.security.CurrentActor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class AuditTrail {

    private static final DateTimeFormatter AUDIT_TIME =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss 'UTC'").withZone(ZoneOffset.UTC);

    private final AuditEventRepository auditEventRepository;
    private final BusinessIds businessIds;
    private final CurrentActor currentActor;

    public AuditTrail(
            AuditEventRepository auditEventRepository,
            BusinessIds businessIds,
            CurrentActor currentActor) {
        this.auditEventRepository = auditEventRepository;
        this.businessIds = businessIds;
        this.currentActor = currentActor;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(AuditCommand command) {
        Instant now = Instant.now();
        String occurredAt = AUDIT_TIME.format(now);
        String details = command.details() == null ? "" : command.details();
        String hash = AuditHash.fingerprint(command.action() + "|" + command.targetRef() + "|" + occurredAt + "|" + details);
        List<AuditDelta> deltas = command.deltas().stream()
                .map(delta -> AuditDelta.of(delta.field(), delta.previous(), delta.current()))
                .toList();
        auditEventRepository.save(AuditEvent.record(
                businessIds.next("aud-"),
                occurredAt,
                currentActor.name(),
                currentActor.role().auditLabel(),
                command.action(),
                command.category(),
                command.entity(),
                command.targetRef(),
                hash,
                command.severity(),
                command.details(),
                currentActor.clientIp(),
                deltas,
                now));
    }
}
