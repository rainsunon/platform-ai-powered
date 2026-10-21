package io.rydata.platform.financing.common;

import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadLocalRandom;

@Component
public class BusinessIds {

    public String next(String prefix) {
        long millis = System.currentTimeMillis();
        int salt = ThreadLocalRandom.current().nextInt(36 * 36);
        return prefix + Long.toUnsignedString(millis, 36) + Integer.toUnsignedString(salt, 36);
    }

    public String transactionRef() {
        int value = ThreadLocalRandom.current().nextInt(10_000, 100_000);
        return "TXN-" + value;
    }

    public String invoiceId() {
        int value = ThreadLocalRandom.current().nextInt(8_800, 9_900);
        return "INV-2024-" + value;
    }
}
