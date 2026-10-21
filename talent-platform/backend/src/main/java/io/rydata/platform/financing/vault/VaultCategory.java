package io.rydata.platform.financing.vault;

import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;

public enum VaultCategory {
    PUBLIC("Public to Client"),
    ADMIN("Client Admin Only"),
    FIRM("Internal Firm Only");

    private final String label;

    VaultCategory(String label) {
        this.label = label;
    }

    public String wire() {
        return name().toLowerCase(Locale.ROOT);
    }

    public String label() {
        return label;
    }

    public static Optional<VaultCategory> fromWire(String value) {
        return Arrays.stream(values())
                .filter(category -> category.wire().equalsIgnoreCase(value) || category.name().equalsIgnoreCase(value))
                .findFirst();
    }
}
