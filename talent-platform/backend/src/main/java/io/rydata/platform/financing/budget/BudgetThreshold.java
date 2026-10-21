package io.rydata.platform.financing.budget;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.jspecify.annotations.Nullable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "budget_threshold", indexes = {
        @Index(name = "idx_budget_threshold_account", columnList = "account_code")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BudgetThreshold {

    @Id
    @Column(nullable = false, updatable = false, length = 64)
    private String id;

    @Column(nullable = false)
    private String category;

    @Column(name = "account_code", nullable = false, length = 32)
    private String accountCode;

    @Column(name = "monthly_budget", nullable = false, precision = 19, scale = 2)
    private BigDecimal monthlyBudget;

    @Column(name = "warning_percentage", nullable = false)
    private int warningPercentage;

    @Column(name = "alert_enabled", nullable = false)
    private boolean alertEnabled;

    @Column(name = "auto_flag_transactions", nullable = false)
    private boolean autoFlagTransactions;

    @Column(length = 1024)
    private @Nullable String notes;

    @Version
    private @Nullable Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private @Nullable Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private @Nullable Instant updatedAt;

    public static BudgetThreshold create(
            String id,
            String category,
            String accountCode,
            BigDecimal monthlyBudget,
            int warningPercentage,
            boolean alertEnabled,
            boolean autoFlagTransactions,
            @Nullable String notes) {
        BudgetThreshold threshold = new BudgetThreshold();
        threshold.id = Objects.requireNonNull(id);
        threshold.category = category;
        threshold.accountCode = accountCode;
        threshold.monthlyBudget = monthlyBudget;
        threshold.warningPercentage = warningPercentage;
        threshold.alertEnabled = alertEnabled;
        threshold.autoFlagTransactions = autoFlagTransactions;
        threshold.notes = notes;
        return threshold;
    }

    public void apply(
            @Nullable String category,
            @Nullable String accountCode,
            @Nullable BigDecimal monthlyBudget,
            @Nullable Integer warningPercentage,
            @Nullable Boolean alertEnabled,
            @Nullable Boolean autoFlagTransactions,
            @Nullable String notes,
            boolean notesProvided) {
        if (category != null && !category.isBlank()) {
            this.category = category.trim();
        }
        if (accountCode != null && !accountCode.isBlank()) {
            this.accountCode = accountCode.trim();
        }
        if (monthlyBudget != null) {
            this.monthlyBudget = monthlyBudget;
        }
        if (warningPercentage != null) {
            this.warningPercentage = warningPercentage;
        }
        if (alertEnabled != null) {
            this.alertEnabled = alertEnabled;
        }
        if (autoFlagTransactions != null) {
            this.autoFlagTransactions = autoFlagTransactions;
        }
        if (notesProvided) {
            this.notes = notes;
        }
    }

    public BudgetMonitor.ThresholdView toView() {
        return new BudgetMonitor.ThresholdView(
                id, category, accountCode, monthlyBudget, warningPercentage, alertEnabled, autoFlagTransactions);
    }
}
