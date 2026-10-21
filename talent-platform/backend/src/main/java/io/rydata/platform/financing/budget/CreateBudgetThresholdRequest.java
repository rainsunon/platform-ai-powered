package io.rydata.platform.financing.budget;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.jspecify.annotations.Nullable;

import java.math.BigDecimal;

public record CreateBudgetThresholdRequest(
        @NotBlank String category,
        @NotBlank String accountCode,
        @NotNull @DecimalMin("0.01") BigDecimal monthlyBudget,
        @NotNull @Min(1) @Max(100) Integer warningPercentage,
        @NotNull Boolean alertEnabled,
        @NotNull Boolean autoFlagTransactions,
        @Nullable String notes
) {
}
