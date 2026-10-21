package io.rydata.platform.financing.common;

import org.jspecify.annotations.Nullable;

public final class Texts {

    private Texts() {
    }

    public static @Nullable String blankToNull(@Nullable String value) {
        if (value == null || value.isBlank() || "all".equalsIgnoreCase(value)) {
            return null;
        }
        return value.trim();
    }

    public static String orDefault(@Nullable String value, String fallback) {
        String normalized = blankToNull(value);
        return normalized == null ? fallback : normalized;
    }
}
