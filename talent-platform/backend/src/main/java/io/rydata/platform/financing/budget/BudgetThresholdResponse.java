package io.rydata.platform.financing.budget;

import org.jspecify.annotations.Nullable;

import java.math.BigDecimal;

public record BudgetThresholdResponse(
        String id,
        String category,
        String accountCode,
        BigDecimal monthlyBudget,
        int warningPercentage,
        boolean alertEnabled,
        boolean autoFlagTransactions,
        @Nullable String notes
) {
    public static BudgetThresholdResponse from(BudgetThreshold threshold) {
        return new BudgetThresholdResponse(
                threshold.getId(),
                threshold.getCategory(),
                threshold.getAccountCode(),
                threshold.getMonthlyBudget(),
                threshold.getWarningPercentage(),
                threshold.isAlertEnabled(),
                threshold.isAutoFlagTransactions(),
                threshold.getNotes());
    }
}
