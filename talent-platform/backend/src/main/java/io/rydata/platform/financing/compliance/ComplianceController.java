package io.rydata.platform.financing.compliance;

import org.jspecify.annotations.Nullable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class ComplianceController {

    private final AuditQueryService auditQueryService;
    private final FiscalPeriodService fiscalPeriodService;

    public ComplianceController(AuditQueryService auditQueryService, FiscalPeriodService fiscalPeriodService) {
        this.auditQueryService = auditQueryService;
        this.fiscalPeriodService = fiscalPeriodService;
    }

    @GetMapping("/api/v1/audit-events")
    public List<AuditEventResponse> auditEvents(@RequestParam(required = false) @Nullable String severity) {
        return auditQueryService.list(severity);
    }

    @GetMapping("/api/v1/fiscal-period")
    public FiscalPeriodResponse fiscalPeriod() {
        return fiscalPeriodService.current();
    }

    @PostMapping("/api/v1/fiscal-period/toggle")
    public FiscalPeriodResponse toggleFiscalPeriod() {
        return fiscalPeriodService.toggle();
    }

    @PatchMapping("/api/v1/fiscal-period")
    public FiscalPeriodResponse updateFiscalPeriod(@RequestBody UpdateFiscalPeriodRequest request) {
        return fiscalPeriodService.update(request);
    }
}
