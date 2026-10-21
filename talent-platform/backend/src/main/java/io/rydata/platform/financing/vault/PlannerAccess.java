package io.rydata.platform.financing.vault;

import java.util.Locale;

public enum PlannerAccess {
    FULL_VIEW,
    FULL_EDIT,
    RESTRICTED,
    HIDDEN;

    public String wire() {
        return name().toLowerCase(Locale.ROOT);
    }
}
