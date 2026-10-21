package io.rydata.platform.financing.vault;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.jspecify.annotations.Nullable;

import java.time.Instant;

@Entity
@Table(name = "vault_file", indexes = {
        @Index(name = "idx_vault_file_category", columnList = "category")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VaultFile {

    @Id
    @Column(nullable = false, updatable = false, length = 64)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String subtitle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private VaultCategory category;

    @Column(name = "category_label", nullable = false, length = 64)
    private String categoryLabel;

    @Column(name = "fiscal_period", nullable = false, length = 64)
    private String fiscalPeriod;

    @Column(name = "file_size", nullable = false, length = 32)
    private String fileSize;

    @Enumerated(EnumType.STRING)
    @Column(name = "planner_access", nullable = false, length = 32)
    private PlannerAccess plannerAccess;

    @Column(nullable = false, length = 64)
    private String icon;

    @Column(name = "icon_bg", nullable = false, length = 128)
    private String iconBg;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private @Nullable Instant createdAt;

    public static VaultFile upload(
            String id,
            String title,
            String subtitle,
            VaultCategory category,
            String fiscalPeriod,
            String fileSize) {
        VaultFile file = new VaultFile();
        file.id = id;
        file.title = title;
        file.subtitle = subtitle;
        file.category = category;
        file.categoryLabel = category.label();
        file.fiscalPeriod = fiscalPeriod;
        file.fileSize = fileSize;
        file.plannerAccess = PlannerAccess.FULL_VIEW;
        file.icon = "description";
        file.iconBg = "bg-primary-fixed text-on-primary-fixed";
        return file;
    }
}
