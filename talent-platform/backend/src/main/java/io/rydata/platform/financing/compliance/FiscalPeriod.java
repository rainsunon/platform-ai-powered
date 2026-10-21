package io.rydata.platform.financing.compliance;

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

import java.time.Instant;

@Entity
@Table(name = "fiscal_period")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FiscalPeriod {

    public static final String CURRENT_ID = "current";

    @Id
    @Column(nullable = false, updatable = false, length = 32)
    private String id;

    @Column(nullable = false)
    private boolean locked;

    @Column(name = "entity_name", nullable = false)
    private String entityName;

    @Version
    private @Nullable Long version;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private @Nullable Instant updatedAt;

    public void toggle() {
        this.locked = !this.locked;
    }

    public void setLocked(boolean locked) {
        this.locked = locked;
    }

    public void rename(String entityName) {
        this.entityName = entityName;
    }
}
