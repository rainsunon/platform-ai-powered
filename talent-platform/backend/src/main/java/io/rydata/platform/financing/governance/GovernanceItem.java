package io.rydata.platform.financing.governance;

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
import java.util.Optional;

@Entity
@Table(name = "governance_item", indexes = {
        @Index(name = "idx_governance_item_signed", columnList = "signed")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GovernanceItem {

    @Id
    @Column(nullable = false, updatable = false, length = 64)
    private String id;

    @Column(nullable = false)
    private String vendor;

    @Column(name = "txn_ref", nullable = false)
    private String txnRef;

    @Column(nullable = false)
    private String category;

    @Column(name = "entity_name", nullable = false)
    private String entityName;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "due_in", nullable = false, length = 128)
    private String dueIn;

    @Column(name = "requires_second_signer", nullable = false)
    private boolean requiresSecondSigner;

    @Column(nullable = false)
    private boolean signed;

    @Column(name = "signer_name")
    private @Nullable String signerName;

    @Version
    private @Nullable Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private @Nullable Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private @Nullable Instant updatedAt;

    public Optional<String> linkedTransactionRef() {
        String trimmed = txnRef.trim();
        int split = trimmed.indexOf(' ');
        String ref = split > 0 ? trimmed.substring(0, split) : trimmed;
        if (ref.startsWith("TXN-")) {
            return Optional.of(ref);
        }
        return Optional.empty();
    }

    public void sign(String signerName) {
        this.signed = true;
        this.signerName = signerName;
    }
}
