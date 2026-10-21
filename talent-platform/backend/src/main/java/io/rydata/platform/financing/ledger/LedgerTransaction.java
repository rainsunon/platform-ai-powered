package io.rydata.platform.financing.ledger;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "ledger_transaction", indexes = {
        @Index(name = "idx_ledger_transaction_entity", columnList = "entity_name"),
        @Index(name = "idx_ledger_transaction_client", columnList = "client_name"),
        @Index(name = "idx_ledger_transaction_status_created", columnList = "status, created_at"),
        @Index(name = "idx_ledger_transaction_account", columnList = "account_code")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LedgerTransaction {

    @Id
    @Column(nullable = false, updatable = false, length = 64)
    private String id;

    @Version
    private @Nullable Long version;

    @Column(nullable = false, unique = true, length = 32)
    private String ref;

    @Column(name = "posted_label", nullable = false, length = 64)
    private String postedLabel;

    @Column(name = "entity_name", nullable = false)
    private String entityName;

    @Column(name = "client_name", nullable = false)
    private String clientName;

    @Column(name = "account_code", nullable = false, length = 32)
    private String accountCode;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CashDirection direction;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private TransactionStatus status;

    @Column(nullable = false, length = 128)
    private String method;

    @Column(name = "requires_dual_sign", nullable = false)
    private boolean requiresDualSign;

    @Column(nullable = false)
    private boolean approved;

    @ElementCollection
    @CollectionTable(
            name = "ledger_transaction_tag",
            joinColumns = @JoinColumn(name = "transaction_id"),
            foreignKey = @ForeignKey(name = "fk_ledger_tag_tx"))
    @OrderColumn(name = "tag_order")
    @Column(name = "tag", nullable = false, length = 64)
    private List<String> tags = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private @Nullable Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private @Nullable Instant updatedAt;

    public static LedgerTransaction post(
            String id,
            String ref,
            String postedLabel,
            String entityName,
            String clientName,
            String accountCode,
            String category,
            BigDecimal amount,
            CashDirection direction,
            TransactionStatus status,
            String method,
            boolean requiresDualSign,
            boolean approved,
            List<String> tags) {
        LedgerTransaction transaction = new LedgerTransaction();
        transaction.id = Objects.requireNonNull(id);
        transaction.ref = Objects.requireNonNull(ref);
        transaction.postedLabel = Objects.requireNonNull(postedLabel);
        transaction.entityName = Objects.requireNonNull(entityName);
        transaction.clientName = Objects.requireNonNull(clientName);
        transaction.accountCode = Objects.requireNonNull(accountCode);
        transaction.category = Objects.requireNonNull(category);
        transaction.amount = Objects.requireNonNull(amount);
        transaction.direction = Objects.requireNonNull(direction);
        transaction.status = Objects.requireNonNull(status);
        transaction.method = Objects.requireNonNull(method);
        transaction.requiresDualSign = requiresDualSign;
        transaction.approved = approved;
        transaction.tags.addAll(tags);
        return transaction;
    }

    public void flagForDualControl() {
        this.status = TransactionStatus.THRESHOLD_FLAG;
        this.requiresDualSign = true;
        this.approved = false;
    }

    public void markVerified() {
        this.status = TransactionStatus.VERIFIED;
        this.approved = true;
    }

    public void relabel(String postedLabel) {
        this.postedLabel = postedLabel;
    }

    public void renameEntity(String entityName) {
        this.entityName = entityName;
    }

    public void renameClient(String clientName) {
        this.clientName = clientName;
    }

    public void reclassify(String accountCode, String category) {
        this.accountCode = accountCode;
        this.category = category;
    }

    public void changeMethod(String method) {
        this.method = method;
    }

    public void changeAmount(BigDecimal amount, CashDirection direction) {
        this.amount = amount;
        this.direction = direction;
    }

    public void replaceTags(List<String> newTags) {
        this.tags.clear();
        this.tags.addAll(newTags);
    }
}
