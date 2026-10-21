package io.rydata.platform.financing.identity;

public record RoleResponse(
        String key,
        String name,
        String shortTitle,
        String title,
        String desc,
        String badgeCash,
        String badgeClass,
        String scope,
        boolean showBatchApprove,
        boolean showApprovals,
        boolean canReconcile,
        boolean canManualEntry,
        boolean canLockPeriod,
        boolean canViewMargins,
        boolean canViewBanking,
        boolean canAuthorizeWires,
        String bankText,
        String primaryInvoiceAction,
        RoleMatrixResponse matrix,
        String footnote
) {
    public record RoleMatrixResponse(
            String role,
            PermissionCell view,
            PermissionCell create,
            PermissionCell approve,
            PermissionCell period,
            PermissionCell audit
    ) {
    }

    public record PermissionCell(boolean granted, String text) {
    }
}
