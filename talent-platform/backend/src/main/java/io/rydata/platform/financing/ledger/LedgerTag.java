package io.rydata.platform.financing.ledger;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ledger_tag")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LedgerTag {

    @Id
    @Column(nullable = false, length = 64)
    private String name;

    public static LedgerTag of(String name) {
        LedgerTag tag = new LedgerTag();
        tag.name = name;
        return tag;
    }
}
