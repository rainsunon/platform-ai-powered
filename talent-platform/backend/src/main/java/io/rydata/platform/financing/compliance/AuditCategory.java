package io.rydata.platform.financing.compliance;

import java.util.Locale;

public enum AuditCategory {
    MANUAL_ENTRY,
    MODIFICATION,
    APPROVAL,
    SECURITY,
    PERIOD_LOCK;

    public String wire() {
        return name().toLowerCase(Locale.ROOT);
    }
}
