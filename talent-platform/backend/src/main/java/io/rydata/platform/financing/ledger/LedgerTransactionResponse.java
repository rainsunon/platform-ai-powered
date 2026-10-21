package io.rydata.platform.financing.ledger;

import java.math.BigDecimal;
import java.util.List;

public record LedgerTransactionResponse(
        String id,
        String ref,
        String date,
        String entity,
        String client,
        String accountCode,
        String category,
        BigDecimal amount,
        String type,
        String status,
        String method,
        boolean requiresDualSign,
        boolean approved,
        List<String> tags
) {
    public static LedgerTransactionResponse from(LedgerTransaction transaction) {
        return new LedgerTransactionResponse(
                transaction.getId(),
                transaction.getRef(),
                transaction.getPostedLabel(),
                transaction.getEntityName(),
                transaction.getClientName(),
                transaction.getAccountCode(),
                transaction.getCategory(),
                transaction.getAmount(),
                transaction.getDirection().wire(),
                transaction.getStatus().wire(),
                transaction.getMethod(),
                transaction.isRequiresDualSign(),
                transaction.isApproved(),
                List.copyOf(transaction.getTags()));
    }
}
