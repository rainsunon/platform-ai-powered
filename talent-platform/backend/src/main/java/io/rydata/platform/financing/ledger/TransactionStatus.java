package io.rydata.platform.financing.ledger;

import java.util.Locale;

public enum TransactionStatus {
    VERIFIED,
    AWAITING_MGR,
    RECONCILED,
    THRESHOLD_FLAG,
    POSTED;

    public String wire() {
        return name().toLowerCase(Locale.ROOT);
    }
}
