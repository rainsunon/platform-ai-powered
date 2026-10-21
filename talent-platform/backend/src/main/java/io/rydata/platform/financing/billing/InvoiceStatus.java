package io.rydata.platform.financing.billing;

import java.util.Locale;

public enum InvoiceStatus {
    PENDING_CLIENT_APPROVAL,
    OVERDUE,
    DRAFT_REVIEW,
    PAID_SETTLED;

    public String wire() {
        return name().toLowerCase(Locale.ROOT);
    }
}
