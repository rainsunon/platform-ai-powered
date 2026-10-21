package io.rydata.platform.financing.identity;

import org.jspecify.annotations.Nullable;

import java.util.List;

public record UpdateMemberRequest(
        @Nullable String role,
        @Nullable Boolean hardware2FA,
        @Nullable Boolean ipGeofenced,
        @Nullable Boolean maskMargins,
        @Nullable Boolean permitScenarioModeling,
        @Nullable Boolean canAuthorizeWires,
        @Nullable String roleExpiry,
        @Nullable String auditLogNote,
        @Nullable List<String> authorizedEntities
) {
}
