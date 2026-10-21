package io.rydata.platform.financing.common;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

public final class AuditHash {

    private AuditHash() {
    }

    public static String fingerprint(String material) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(material.getBytes(StandardCharsets.UTF_8));
            String hex = HexFormat.of().formatHex(digest);
            return "0x" + hex.substring(0, 8) + "..." + hex.substring(hex.length() - 5);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }
}
