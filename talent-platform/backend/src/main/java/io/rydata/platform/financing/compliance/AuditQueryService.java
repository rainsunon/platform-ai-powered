package io.rydata.platform.financing.compliance;

import io.rydata.platform.financing.common.Texts;
import io.rydata.platform.financing.common.exception.BusinessRuleViolationException;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class AuditQueryService {

    private final AuditEventRepository auditEventRepository;

    public AuditQueryService(AuditEventRepository auditEventRepository) {
        this.auditEventRepository = auditEventRepository;
    }

    public List<AuditEventResponse> list(@Nullable String severity) {
        String normalized = Texts.blankToNull(severity);
        if (normalized == null) {
            return auditEventRepository.findAllByOrderByCreatedAtDesc().stream()
                    .map(AuditEventResponse::from)
                    .toList();
        }
        AuditSeverity parsed = AuditSeverity.fromWire(normalized)
                .orElseThrow(() -> new BusinessRuleViolationException(
                        "UNKNOWN_SEVERITY", "Severity must be low, medium, high, or critical"));
        return auditEventRepository.findBySeverityOrderByCreatedAtDesc(parsed).stream()
                .map(AuditEventResponse::from)
                .toList();
    }
}
