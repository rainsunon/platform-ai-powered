package io.rydata.platform.financing.governance;

import org.jspecify.annotations.Nullable;

import java.math.BigDecimal;

public record GovernanceItemResponse(
        String id,
        String vendor,
        String txnRef,
        String category,
        String entity,
        BigDecimal amount,
        String dueIn,
        boolean requiresSecondSigner,
        boolean signed,
        @Nullable String signerName
) {
    public static GovernanceItemResponse from(GovernanceItem item) {
        return new GovernanceItemResponse(
                item.getId(),
                item.getVendor(),
                item.getTxnRef(),
                item.getCategory(),
                item.getEntityName(),
                item.getAmount(),
                item.getDueIn(),
                item.isRequiresSecondSigner(),
                item.isSigned(),
                item.getSignerName());
    }
}
