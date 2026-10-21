package io.rydata.platform.financing.identity;

import io.rydata.platform.financing.common.security.PlatformRole;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "team_member", indexes = {
        @Index(name = "idx_team_member_role", columnList = "role")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TeamMember {

    @Id
    @Column(nullable = false, updatable = false, length = 64)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "avatar_initials", nullable = false, length = 8)
    private String avatarInitials;

    @Column(name = "avatar_bg", nullable = false, length = 128)
    private String avatarBg;

    @Column(nullable = false, length = 32)
    private String role;

    @Column(name = "role_label", nullable = false, length = 64)
    private String roleLabel;

    @Column(name = "badge_bg", nullable = false, length = 128)
    private String badgeBg;

    @Column(name = "badge_text", nullable = false, length = 128)
    private String badgeText;

    @Column(nullable = false)
    private boolean active;

    @Embedded
    private MemberCapabilities capabilities;

    @ElementCollection
    @CollectionTable(
            name = "team_member_entity",
            joinColumns = @JoinColumn(name = "member_id"),
            foreignKey = @ForeignKey(name = "fk_member_entity_member"))
    @OrderColumn(name = "entity_order")
    @Column(name = "entity_name", nullable = false)
    private List<String> authorizedEntities = new ArrayList<>();

    @Column(name = "hardware_2fa", nullable = false)
    private boolean hardware2fa;

    @Column(name = "ip_geofenced", nullable = false)
    private boolean ipGeofenced;

    @Column(name = "mask_margins", nullable = false)
    private boolean maskMargins;

    @Column(name = "permit_scenario_modeling", nullable = false)
    private boolean permitScenarioModeling;

    @Column(name = "can_authorize_wires", nullable = false)
    private boolean canAuthorizeWires;

    @Column(name = "role_expiry", nullable = false, length = 128)
    private String roleExpiry;

    @Column(name = "elevation_protocol", nullable = false)
    private String elevationProtocol;

    @Column(name = "audit_log_note", nullable = false, length = 1024)
    private String auditLogNote;

    @Version
    private @Nullable Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private @Nullable Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private @Nullable Instant updatedAt;

    public void assignRole(PlatformRole role) {
        this.role = role.wire();
        this.roleLabel = role.memberLabel();
        this.badgeBg = role.badgeBg();
        this.badgeText = role.badgeText();
        this.capabilities = switch (role) {
            case MANAGER, CLIENT_ADMIN -> MemberCapabilities.of(true, true, true, true);
            case MEMBER -> MemberCapabilities.of(true, false, true, true);
            case CLIENT_STAFF -> MemberCapabilities.of(true, false, false, false);
            case CLIENT_PLANNER -> MemberCapabilities.of(true, false, true, false);
        };
    }

    public void applyGuardrails(
            @Nullable Boolean hardware2fa,
            @Nullable Boolean ipGeofenced,
            @Nullable Boolean maskMargins,
            @Nullable Boolean permitScenarioModeling,
            @Nullable Boolean canAuthorizeWires,
            @Nullable String roleExpiry,
            @Nullable String auditLogNote,
            @Nullable List<String> authorizedEntities) {
        if (hardware2fa != null) {
            this.hardware2fa = hardware2fa;
        }
        if (ipGeofenced != null) {
            this.ipGeofenced = ipGeofenced;
        }
        if (maskMargins != null) {
            this.maskMargins = maskMargins;
        }
        if (permitScenarioModeling != null) {
            this.permitScenarioModeling = permitScenarioModeling;
        }
        if (canAuthorizeWires != null) {
            this.canAuthorizeWires = canAuthorizeWires;
        }
        if (roleExpiry != null && !roleExpiry.isBlank()) {
            this.roleExpiry = roleExpiry.trim();
        }
        if (auditLogNote != null && !auditLogNote.isBlank()) {
            this.auditLogNote = auditLogNote.trim();
        }
        if (authorizedEntities != null && !authorizedEntities.isEmpty()) {
            this.authorizedEntities.clear();
            this.authorizedEntities.addAll(authorizedEntities);
        }
    }

    public void revoke() {
        this.active = false;
    }
}
