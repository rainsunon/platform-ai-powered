package io.rydata.platform.financing.ledger;

import org.jspecify.annotations.Nullable;

import java.math.BigDecimal;
import java.util.List;

public record CreateTransactionRequest(
        @Nullable String entity,
        @Nullable String client,
        @Nullable String accountCode,
        @Nullable String category,
        @Nullable BigDecimal amount,
        @Nullable String method,
        @Nullable List<String> tags
) {
}
