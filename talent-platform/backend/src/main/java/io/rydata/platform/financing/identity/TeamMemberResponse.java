package io.rydata.platform.financing.identity;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record TeamMemberResponse(
        String id,
        String name,
        String email,
        String avatarInitials,
        String avatarBg,
        String role,
        String roleLabel,
        String badgeBg,
        String badgeText,
        @JsonProperty("isActive") boolean isActive,
        CapabilitiesResponse capabilities,
        List<String> authorizedEntities,
        @JsonProperty("hardware2FA") boolean hardware2FA,
        boolean ipGeofenced,
        boolean maskMargins,
        boolean permitScenarioModeling,
        boolean canAuthorizeWires,
        String roleExpiry,
        String elevationProtocol,
        String auditLogNote
) {
    public static TeamMemberResponse from(TeamMember member) {
        return new TeamMemberResponse(
                member.getId(),
                member.getName(),
                member.getEmail(),
                member.getAvatarInitials(),
                member.getAvatarBg(),
                member.getRole(),
                member.getRoleLabel(),
                member.getBadgeBg(),
                member.getBadgeText(),
                member.isActive(),
                CapabilitiesResponse.from(member.getCapabilities()),
                List.copyOf(member.getAuthorizedEntities()),
                member.isHardware2fa(),
                member.isIpGeofenced(),
                member.isMaskMargins(),
                member.isPermitScenarioModeling(),
                member.isCanAuthorizeWires(),
                member.getRoleExpiry(),
                member.getElevationProtocol(),
                member.getAuditLogNote());
    }
}
