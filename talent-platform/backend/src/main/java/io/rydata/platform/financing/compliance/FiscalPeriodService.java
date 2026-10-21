package io.rydata.platform.financing.compliance;

import io.rydata.platform.financing.common.exception.BusinessRuleViolationException;
import io.rydata.platform.financing.common.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class FiscalPeriodService {

    private static final Logger log = LoggerFactory.getLogger(FiscalPeriodService.class);

    private final FiscalPeriodRepository fiscalPeriodRepository;
    private final AuditTrail auditTrail;

    public FiscalPeriodService(FiscalPeriodRepository fiscalPeriodRepository, AuditTrail auditTrail) {
        this.fiscalPeriodRepository = fiscalPeriodRepository;
        this.auditTrail = auditTrail;
    }

    public FiscalPeriodResponse current() {
        return FiscalPeriodResponse.from(load());
    }

    public void requireOpen() {
        if (load().isLocked()) {
            throw new BusinessRuleViolationException(
                    "PERIOD_LOCKED",
                    "Fiscal period is locked. Journal mutations are restricted under SOX 404.");
        }
    }

    @Transactional
    public FiscalPeriodResponse toggle() {
        FiscalPeriod period = load();
        boolean previous = period.isLocked();
        period.toggle();
        return recordLockChange(period, previous);
    }

    @Transactional
    public FiscalPeriodResponse update(UpdateFiscalPeriodRequest request) {
        FiscalPeriod period = load();
        boolean previous = period.isLocked();
        if (request.entity() != null && !request.entity().isBlank()) {
            period.rename(request.entity().trim());
        }
        if (request.locked() != null && request.locked() != previous) {
            period.setLocked(request.locked());
            return recordLockChange(period, previous);
        }
        return FiscalPeriodResponse.from(period);
    }

    private FiscalPeriodResponse recordLockChange(FiscalPeriod period, boolean previous) {
        boolean locked = period.isLocked();
        log.info("Fiscal period {} for {}", locked ? "locked" : "unlocked", period.getEntityName());
        List<AuditDeltaResponse> deltas = new ArrayList<>();
        deltas.add(new AuditDeltaResponse(
                "PeriodLock",
                previous ? "Locked (SOX 404 Enforced)" : "Open (Drafting)",
                locked ? "Locked (SOX 404 Enforced)" : "Open (Drafting)"));
        auditTrail.record(new AuditCommand(
                locked ? "FISCAL_PERIOD_SEALED" : "FISCAL_PERIOD_OPENED",
                AuditCategory.PERIOD_LOCK,
                period.getEntityName(),
                "Current accounting period",
                locked ? AuditSeverity.HIGH : AuditSeverity.MEDIUM,
                locked
                        ? "Fiscal period locked. Journal voucher mutations and backdated postings sealed under ISO 27001."
                        : "Authorized ledger postings and journal mutations unlocked for Manager.",
                deltas));
        return FiscalPeriodResponse.from(period);
    }

    private FiscalPeriod load() {
        return fiscalPeriodRepository.findById(FiscalPeriod.CURRENT_ID)
                .orElseThrow(() -> new ResourceNotFoundException("FISCAL_PERIOD_NOT_FOUND", "Fiscal period is not configured"));
    }
}
