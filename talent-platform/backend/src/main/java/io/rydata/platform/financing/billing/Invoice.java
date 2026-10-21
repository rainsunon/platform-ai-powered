package io.rydata.platform.financing.billing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import org.jspecify.annotations.Nullable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoice", indexes = {
        @Index(name = "idx_invoice_status", columnList = "status")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Invoice {

    @Id
    @Column(nullable = false, updatable = false, length = 64)
    private String id;

    @Column(name = "client_entity", nullable = false)
    private String clientEntity;

    @Column(name = "client_sub_unit", nullable = false)
    private String clientSubUnit;

    @Column(name = "avatar_initials", nullable = false, length = 8)
    private String avatarInitials;

    @Column(name = "scope_role", nullable = false, length = 64)
    private String scopeRole;

    @Column(name = "issue_date", nullable = false, length = 64)
    private String issueDate;

    @Column(name = "due_date", nullable = false, length = 64)
    private String dueDate;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private InvoiceStatus status;

    @Column(name = "period_label", nullable = false, length = 128)
    private String periodLabel;

    @Column(name = "tax_id", nullable = false, length = 64)
    private String taxId;

    @Column(name = "direct_cost", nullable = false, precision = 19, scale = 2)
    private BigDecimal directCost;

    @Column(name = "gross_profit", nullable = false, precision = 19, scale = 2)
    private BigDecimal grossProfit;

    @Column(name = "profit_margin_percent", nullable = false, precision = 6, scale = 2)
    private BigDecimal profitMarginPercent;

    @Column(name = "write_off_max", nullable = false, precision = 19, scale = 2)
    private BigDecimal writeOffMax;

    @Column(name = "recipient_bank", nullable = false)
    private String recipientBank;

    @Column(name = "payment_protocol", nullable = false, length = 128)
    private String paymentProtocol;

    @Column(nullable = false)
    private boolean disputed;

    @Column(name = "dispute_reason", length = 512)
    private @Nullable String disputeReason;

    @Version
    private @Nullable Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private @Nullable Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private @Nullable Instant updatedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "line_items", nullable = false)
    private List<InvoiceLineDetail> lineItems = new ArrayList<>();

    public static Invoice issue(
            String id,
            String clientEntity,
            String clientSubUnit,
            String avatarInitials,
            String scopeRole,
            String issueDate,
            String dueDate,
            BigDecimal amount,
            String periodLabel,
            String taxId,
            BigDecimal directCost,
            BigDecimal grossProfit,
            BigDecimal profitMarginPercent,
            BigDecimal writeOffMax,
            String recipientBank,
            String paymentProtocol) {
        Invoice invoice = new Invoice();
        invoice.id = id;
        invoice.clientEntity = clientEntity;
        invoice.clientSubUnit = clientSubUnit;
        invoice.avatarInitials = avatarInitials;
        invoice.scopeRole = scopeRole;
        invoice.issueDate = issueDate;
        invoice.dueDate = dueDate;
        invoice.amount = amount;
        invoice.status = InvoiceStatus.PENDING_CLIENT_APPROVAL;
        invoice.periodLabel = periodLabel;
        invoice.taxId = taxId;
        invoice.directCost = directCost;
        invoice.grossProfit = grossProfit;
        invoice.profitMarginPercent = profitMarginPercent;
        invoice.writeOffMax = writeOffMax;
        invoice.recipientBank = recipientBank;
        invoice.paymentProtocol = paymentProtocol;
        invoice.disputed = false;
        return invoice;
    }

    public void addLine(String id, String title, String description, BigDecimal amount) {
        lineItems.add(new InvoiceLineDetail(id, title, description, amount));
    }

    public void settle() {
        this.status = InvoiceStatus.PAID_SETTLED;
    }

    public void dispute(String reason) {
        this.disputed = true;
        this.disputeReason = reason;
    }
}
