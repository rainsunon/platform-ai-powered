package io.rydata.platform.financing.governance;

import io.rydata.platform.financing.common.exception.BusinessRuleViolationException;
import io.rydata.platform.financing.common.exception.ResourceNotFoundException;
import io.rydata.platform.financing.common.security.CurrentActor;
import io.rydata.platform.financing.compliance.AuditCategory;
import io.rydata.platform.financing.compliance.AuditCommand;
import io.rydata.platform.financing.compliance.AuditDeltaResponse;
import io.rydata.platform.financing.compliance.AuditSeverity;
import io.rydata.platform.financing.compliance.AuditTrail;
import io.rydata.platform.financing.ledger.LedgerTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class GovernanceService {

    private static final Logger log = LoggerFactory.getLogger(GovernanceService.class);

    private final GovernanceItemRepository governanceItemRepository;
    private final LedgerTransactionRepository transactionRepository;
    private final AuditTrail auditTrail;
    private final CurrentActor currentActor;

    public GovernanceService(
            GovernanceItemRepository governanceItemRepository,
            LedgerTransactionRepository transactionRepository,
            AuditTrail auditTrail,
            CurrentActor currentActor) {
        this.governanceItemRepository = governanceItemRepository;
        this.transactionRepository = transactionRepository;
        this.auditTrail = auditTrail;
        this.currentActor = currentActor;
    }

    public List<GovernanceItemResponse> list() {
        return governanceItemRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(GovernanceItemResponse::from)
                .toList();
    }

    @Transactional
    public GovernanceItemResponse sign(String id) {
        GovernanceItem item = governanceItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "GOVERNANCE_ITEM_NOT_FOUND", "Governance item " + id + " was not found"));
        if (item.isSigned()) {
            throw new BusinessRuleViolationException("ALREADY_SIGNED", "This item already has a second signature");
        }
        String signer = currentActor.name();
        item.sign(signer);
        item.linkedTransactionRef().flatMap(transactionRepository::findByRef).ifPresent(transaction -> {
            transaction.markVerified();
            log.info("Dual-sign released transaction {}", transaction.getRef());
        });
        auditTrail.record(new AuditCommand(
                "DUAL_SIGN_APPROVED",
                AuditCategory.APPROVAL,
                item.getEntityName(),
                item.getVendor() + " (" + NumberFormat.getCurrencyInstance(Locale.US).format(item.getAmount()) + ")",
                AuditSeverity.HIGH,
                "Executive dual-signature authorization released under SOX 404 segregation of duties.",
                List.of(
                        new AuditDeltaResponse("SignerStatus", "Awaiting 2nd Signer", "Executive Signed"),
                        new AuditDeltaResponse("LedgerStatus", "Awaiting Mgr", "Verified & Posted"))));
        return GovernanceItemResponse.from(item);
    }
}
