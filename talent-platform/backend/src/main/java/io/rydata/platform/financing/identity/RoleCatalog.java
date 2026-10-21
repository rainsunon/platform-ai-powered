package io.rydata.platform.financing.identity;

import io.rydata.platform.financing.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RoleCatalog {

    public List<RoleResponse> all() {
        return List.of(manager(), member(), clientAdmin(), clientStaff(), clientPlanner());
    }

    public RoleResponse get(String key) {
        return all().stream()
                .filter(role -> role.key().equalsIgnoreCase(key))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("ROLE_NOT_FOUND", "Role " + key + " was not found"));
    }

    private static RoleResponse manager() {
        return role("manager", "Manager", "Manager",
                "Active Simulation View: Manager (Internal Finance Lead)",
                "Showing full executive oversight, dual-sign approval triggers, ledger mutation capabilities, and immutable audit logging.",
                "Manager Only: Real-time Bank Sync Active",
                "bg-primary-fixed text-on-primary-fixed-variant",
                "Tier 1 Superuser Ledger",
                true, true, true, true, true, true, true, true,
                "J.P. Morgan Chase (Full ABA: 021000021)",
                "New Master Invoice",
                "MANAGER", true, "GRANTED", true, "GRANTED", true, "AUTHORITY", true, "AUTHORIZED", true, "FULL ACCESS",
                "Managers maintain unrestricted oversight across multi-entity consolidations under ISO 27001 policies.");
    }

    private static RoleResponse member() {
        return role("member", "Member", "Member",
                "Active Simulation View: Member (Staff Accountant)",
                "Standard operational permissions: Create transactions, execute reconciliations, view unposted drafts.",
                "Standard Sync: Updates Hourly",
                "bg-surface-container-high text-on-surface-variant",
                "Operational Ledger Drafter",
                false, false, true, true, false, true, true, false,
                "J.P. Morgan Chase (•••• 8912)",
                "Add Billable Line Item",
                "MEMBER", true, "GRANTED", true, "GRANTED", false, "RESTRICTED", false, "LOCKED", true, "VIEW ONLY",
                "Members can post drafts and match reconciliation pairs, but cannot approve transactions over $10k.");
    }

    private static RoleResponse clientAdmin() {
        return role("client_admin", "Client Admin", "Client Admin",
                "Active Simulation View: Client Admin (Corporate Controller)",
                "Scoped external view: Read-only ledger reports, invoice payment approvals, and client entity budgets.",
                "Entity Scoped: Acme Global Only",
                "bg-secondary-container text-on-secondary-container",
                "External Authorizer",
                false, false, false, false, false, false, true, true,
                "J.P. Morgan Chase (•••• 8912)",
                "Authorize Batch",
                "CLIENT ADMIN", true, "SCOPED ENTITY", false, "RESTRICTED", true, "INVOICE ONLY", false, "NO ACCESS", false, "REDACTED",
                "Client Admins possess outward-facing fiscal sign-offs exclusively for verified client billing vouchers.");
    }

    private static RoleResponse clientStaff() {
        return role("client_staff", "Client Staff", "Client Staff",
                "Active Simulation View: Client Staff (AP / AR Specialist)",
                "Restricted external view: Submit expense receipts and view settled statements only.",
                "Summary View Only",
                "bg-tertiary-fixed text-on-tertiary-container",
                "Itemized Verification",
                false, false, false, false, false, false, false, false,
                "[Masked - Requires Client Admin]",
                "Export All Receipts",
                "CLIENT STAFF", true, "STATEMENTS", false, "NO ACCESS", false, "NO ACCESS", false, "NO ACCESS", false, "NO ACCESS",
                "Client Staff are isolated to view-only access on reconciled statements without journal mutation rights.");
    }

    private static RoleResponse clientPlanner() {
        return role("client_planner", "Client Planner", "Client Planner",
                "Active Simulation View: Client Planner (Financial Analyst)",
                "Read-only financial model view: Cash flow forecasts, budget vs actual variance, scenario planning.",
                "Forecast Baseline Fed",
                "bg-surface-container-highest text-primary",
                "Forecast Analytics",
                false, false, false, false, false, false, false, false,
                "[Masked - Restricted for Analytics Role]",
                "Model Milestone Forecast",
                "CLIENT PLANNER", true, "ANALYTICS", false, "NO ACCESS", false, "NO ACCESS", false, "NO ACCESS", false, "NO ACCESS",
                "Planners access anonymized aggregated metric feeds for long-term runway projection modeling.");
    }

    private static RoleResponse role(
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
            String matrixRole,
            boolean view,
            String viewText,
            boolean create,
            String createText,
            boolean approve,
            String approveText,
            boolean period,
            String periodText,
            boolean audit,
            String auditText,
            String footnote) {
        return new RoleResponse(
                key, name, shortTitle, title, desc, badgeCash, badgeClass, scope,
                showBatchApprove, showApprovals, canReconcile, canManualEntry, canLockPeriod,
                canViewMargins, canViewBanking, canAuthorizeWires, bankText, primaryInvoiceAction,
                new RoleResponse.RoleMatrixResponse(
                        matrixRole,
                        new RoleResponse.PermissionCell(view, viewText),
                        new RoleResponse.PermissionCell(create, createText),
                        new RoleResponse.PermissionCell(approve, approveText),
                        new RoleResponse.PermissionCell(period, periodText),
                        new RoleResponse.PermissionCell(audit, auditText)),
                footnote);
    }
}
