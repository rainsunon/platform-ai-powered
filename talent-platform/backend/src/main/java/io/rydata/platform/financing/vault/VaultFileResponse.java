package io.rydata.platform.financing.vault;

public record VaultFileResponse(
        String id,
        String title,
        String subtitle,
        String category,
        String categoryLabel,
        String fiscalPeriod,
        String fileSize,
        String plannerAccess,
        String icon,
        String iconBg
) {
    public static VaultFileResponse from(VaultFile file) {
        return new VaultFileResponse(
                file.getId(),
                file.getTitle(),
                file.getSubtitle(),
                file.getCategory().wire(),
                file.getCategoryLabel(),
                file.getFiscalPeriod(),
                file.getFileSize(),
                file.getPlannerAccess().wire(),
                file.getIcon(),
                file.getIconBg());
    }
}
