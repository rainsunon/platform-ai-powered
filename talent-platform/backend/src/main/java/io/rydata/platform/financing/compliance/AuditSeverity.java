package io.rydata.platform.financing.compliance;

import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;

public enum AuditSeverity {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL;

    public String wire() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static Optional<AuditSeverity> fromWire(String value) {
        return Arrays.stream(values())
                .filter(severity -> severity.wire().equalsIgnoreCase(value) || severity.name().equalsIgnoreCase(value))
                .findFirst();
    }
}
