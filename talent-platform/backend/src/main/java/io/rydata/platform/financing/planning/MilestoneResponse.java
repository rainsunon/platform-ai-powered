package io.rydata.platform.financing.planning;

import java.math.BigDecimal;

public record MilestoneResponse(
        String id,
        String title,
        String status,
        String statusColor,
        BigDecimal budget,
        BigDecimal spent,
        String phaseTarget,
        String validationNote
) {
    public static MilestoneResponse from(Milestone milestone) {
        return new MilestoneResponse(
                milestone.getId(),
                milestone.getTitle(),
                milestone.getStatus(),
                milestone.getStatusColor(),
                milestone.getBudget(),
                milestone.getSpent(),
                milestone.getPhaseTarget(),
                milestone.getValidationNote());
    }
}
