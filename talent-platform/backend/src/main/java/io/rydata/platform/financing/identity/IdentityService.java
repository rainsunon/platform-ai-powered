package io.rydata.platform.financing.identity;

import io.rydata.platform.financing.common.exception.BusinessRuleViolationException;
import io.rydata.platform.financing.common.exception.ResourceNotFoundException;
import io.rydata.platform.financing.common.security.PlatformRole;
import io.rydata.platform.financing.compliance.AuditCategory;
import io.rydata.platform.financing.compliance.AuditCommand;
import io.rydata.platform.financing.compliance.AuditDeltaResponse;
import io.rydata.platform.financing.compliance.AuditSeverity;
import io.rydata.platform.financing.compliance.AuditTrail;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class IdentityService {

    private static final Logger log = LoggerFactory.getLogger(IdentityService.class);

    private final TeamMemberRepository teamMemberRepository;
    private final AuditTrail auditTrail;

    public IdentityService(TeamMemberRepository teamMemberRepository, AuditTrail auditTrail) {
        this.teamMemberRepository = teamMemberRepository;
        this.auditTrail = auditTrail;
    }

    public List<TeamMemberResponse> list() {
        return teamMemberRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(TeamMemberResponse::from)
                .toList();
    }

    public TeamMemberResponse get(String id) {
        return TeamMemberResponse.from(load(id));
    }

    @Transactional
    public TeamMemberResponse update(String id, UpdateMemberRequest request) {
        TeamMember member = load(id);
        String previousRole = member.getRole();
        if (request.role() != null && !request.role().isBlank()) {
            PlatformRole role = PlatformRole.fromWire(request.role())
                    .orElseThrow(() -> new BusinessRuleViolationException(
                            "UNKNOWN_ROLE", "Unknown role " + request.role()));
            member.assignRole(role);
        }
        member.applyGuardrails(
                request.hardware2FA(),
                request.ipGeofenced(),
                request.maskMargins(),
                request.permitScenarioModeling(),
                request.canAuthorizeWires(),
                request.roleExpiry(),
                request.auditLogNote(),
                request.authorizedEntities());
        String entity = member.getAuthorizedEntities().isEmpty()
                ? "Acme Global Holdings"
                : member.getAuthorizedEntities().getFirst();
        auditTrail.record(new AuditCommand(
                "RBAC_SECURITY_MODIFIED",
                AuditCategory.SECURITY,
                entity,
                "User " + member.getId() + " -> " + member.getRole(),
                AuditSeverity.HIGH,
                member.getAuditLogNote(),
                List.of(new AuditDeltaResponse("AuthorityTier", previousRole, member.getRole()))));
        log.info("Updated access for {}", member.getId());
        return TeamMemberResponse.from(member);
    }

    @Transactional
    public TeamMemberResponse revoke(String id) {
        TeamMember member = load(id);
        if (member.isActive()) {
            member.revoke();
            auditTrail.record(new AuditCommand(
                    "ACCESS_REVOCATION",
                    AuditCategory.SECURITY,
                    "Acme Global Holdings",
                    "Revoked User " + member.getId(),
                    AuditSeverity.CRITICAL,
                    "Tenant credentials invalidated for " + member.getEmail(),
                    List.of(new AuditDeltaResponse("Active", "true", "false"))));
            log.info("Revoked access for {}", member.getId());
        }
        return TeamMemberResponse.from(member);
    }

    private TeamMember load(String id) {
        return teamMemberRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MEMBER_NOT_FOUND", "Member " + id + " was not found"));
    }
}
