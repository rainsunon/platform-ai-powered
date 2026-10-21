package io.rydata.platform.financing.budget;

import java.math.BigDecimal;

public record BudgetReportResponse(
        BudgetThresholdResponse threshold,
        BigDecimal currentSpend,
        BigDecimal remainingBudget,
        BigDecimal utilizationPercent,
        String status,
        boolean isBreached,
        boolean isWarning
) {
}
