package io.rydata.platform.financing.compliance;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditEventRepository extends JpaRepository<AuditEvent, String> {

    @EntityGraph(attributePaths = "deltas")
    List<AuditEvent> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "deltas")
    List<AuditEvent> findBySeverityOrderByCreatedAtDesc(AuditSeverity severity);
}
