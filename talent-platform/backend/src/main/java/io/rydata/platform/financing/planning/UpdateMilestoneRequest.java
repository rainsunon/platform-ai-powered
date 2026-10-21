package io.rydata.platform.financing.planning;

import jakarta.validation.constraints.DecimalMin;
import org.jspecify.annotations.Nullable;

import java.math.BigDecimal;

public record UpdateMilestoneRequest(
        @Nullable String title,
        @Nullable String status,
        @Nullable String statusColor,
        @Nullable @DecimalMin("0.00") BigDecimal budget,
        @Nullable @DecimalMin("0.00") BigDecimal spent,
        @Nullable String phaseTarget,
        @Nullable String validationNote
) {
}
