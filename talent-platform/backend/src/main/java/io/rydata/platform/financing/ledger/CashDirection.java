package io.rydata.platform.financing.ledger;

import java.util.Locale;

public enum CashDirection {
    INFLOW,
    OUTFLOW;

    public String wire() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static CashDirection fromAmountSign(int signum) {
        return signum >= 0 ? INFLOW : OUTFLOW;
    }
}
