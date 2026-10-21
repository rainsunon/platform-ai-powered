package io.rydata.platform.financing.planning;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;
import org.jspecify.annotations.Nullable;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "milestone")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Milestone {

    @Id
    @Column(nullable = false, updatable = false, length = 64)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "status_color", nullable = false, length = 16)
    private String statusColor;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal budget;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal spent;

    @Column(name = "phase_target", nullable = false, length = 128)
    private String phaseTarget;

    @Column(name = "validation_note", nullable = false, length = 512)
    private String validationNote;

    @Version
    private @Nullable Long version;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private @Nullable Instant updatedAt;

    public void apply(
            @Nullable String title,
            @Nullable String status,
            @Nullable String statusColor,
            @Nullable BigDecimal budget,
            @Nullable BigDecimal spent,
            @Nullable String phaseTarget,
            @Nullable String validationNote) {
        if (title != null && !title.isBlank()) {
            this.title = title.trim();
        }
        if (status != null && !status.isBlank()) {
            this.status = status.trim();
        }
        if (statusColor != null && !statusColor.isBlank()) {
            this.statusColor = statusColor.trim();
        }
        if (budget != null) {
            this.budget = budget;
        }
        if (spent != null) {
            this.spent = spent;
        }
        if (phaseTarget != null && !phaseTarget.isBlank()) {
            this.phaseTarget = phaseTarget.trim();
        }
        if (validationNote != null && !validationNote.isBlank()) {
            this.validationNote = validationNote.trim();
        }
    }
}
