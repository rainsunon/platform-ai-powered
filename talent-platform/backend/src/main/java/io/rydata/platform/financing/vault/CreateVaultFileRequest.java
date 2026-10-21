package io.rydata.platform.financing.vault;

import org.jspecify.annotations.Nullable;

public record CreateVaultFileRequest(
        @Nullable String title,
        @Nullable String subtitle,
        @Nullable String category,
        @Nullable String fiscalPeriod,
        @Nullable String fileSize
) {
}
