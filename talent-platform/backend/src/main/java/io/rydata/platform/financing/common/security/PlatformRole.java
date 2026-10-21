package io.rydata.platform.financing.common.security;

import java.util.Arrays;
import java.util.Optional;

public enum PlatformRole {
    MANAGER("manager", "MANAGER", "Manager", "Elena Rostova (Executive VP)", "Internal Manager",
            "bg-primary text-white", "bg-primary-fixed", "text-on-primary-fixed-variant", true, true),
    MEMBER("member", "MEMBER", "Member", "Alex Chen", "Internal Member",
            "bg-surface-container-high text-on-surface", "bg-surface-container-high", "text-on-surface-variant", true, true),
    CLIENT_ADMIN("client_admin", "CLIENT_ADMIN", "Client Admin", "Marcus Vance", "Client Admin",
            "bg-[#0f766e] text-white", "bg-[#f0fdfa]", "text-[#0f766e]", false, true),
    CLIENT_STAFF("client_staff", "CLIENT_STAFF", "Client Staff", "Dave Robinson", "Client Staff",
            "bg-[#0369a1] text-white", "bg-[#f0f9ff]", "text-[#0369a1]", false, false),
    CLIENT_PLANNER("client_planner", "CLIENT_PLANNER", "Client Planner", "Elena Gomez", "Client Planner",
            "bg-[#6d28d9] text-white", "bg-[#f5f3ff]", "text-[#6d28d9]", false, false);

    private final String wire;
    private final String authority;
    private final String auditLabel;
    private final String actorName;
    private final String memberLabel;
    private final String avatarBg;
    private final String badgeBg;
    private final String badgeText;
    private final boolean canViewMargins;
    private final boolean canViewBanking;

    PlatformRole(
            String wire,
            String authority,
            String auditLabel,
            String actorName,
            String memberLabel,
            String avatarBg,
            String badgeBg,
            String badgeText,
            boolean canViewMargins,
            boolean canViewBanking) {
        this.wire = wire;
        this.authority = authority;
        this.auditLabel = auditLabel;
        this.actorName = actorName;
        this.memberLabel = memberLabel;
        this.avatarBg = avatarBg;
        this.badgeBg = badgeBg;
        this.badgeText = badgeText;
        this.canViewMargins = canViewMargins;
        this.canViewBanking = canViewBanking;
    }

    public String wire() {
        return wire;
    }

    public String authority() {
        return authority;
    }

    public String auditLabel() {
        return auditLabel;
    }

    public String actorName() {
        return actorName;
    }

    public String memberLabel() {
        return memberLabel;
    }

    public String avatarBg() {
        return avatarBg;
    }

    public String badgeBg() {
        return badgeBg;
    }

    public String badgeText() {
        return badgeText;
    }

    public boolean canViewMargins() {
        return canViewMargins;
    }

    public boolean canViewBanking() {
        return canViewBanking;
    }

    public boolean canSeeFirmVault() {
        return this == MANAGER || this == MEMBER;
    }

    public boolean canSeeAdminVault() {
        return this != CLIENT_STAFF && this != CLIENT_PLANNER;
    }

    public static Optional<PlatformRole> fromWire(String value) {
        return Arrays.stream(values())
                .filter(role -> role.wire.equalsIgnoreCase(value) || role.name().equalsIgnoreCase(value))
                .findFirst();
    }
}
