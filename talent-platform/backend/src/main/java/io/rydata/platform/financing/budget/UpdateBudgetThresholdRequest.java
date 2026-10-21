package io.rydata.platform.financing.budget;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.jspecify.annotations.Nullable;

import java.math.BigDecimal;

public record UpdateBudgetThresholdRequest(
        @Nullable String category,
        @Nullable String accountCode,
        @Nullable @DecimalMin("0.01") BigDecimal monthlyBudget,
        @Nullable @Min(1) @Max(100) Integer warningPercentage,
        @Nullable Boolean alertEnabled,
        @Nullable Boolean autoFlagTransactions,
        @Nullable String notes
) {
}
