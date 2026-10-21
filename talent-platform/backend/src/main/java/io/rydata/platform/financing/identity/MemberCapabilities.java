package io.rydata.platform.financing.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberCapabilities {

    @Column(name = "cap_invoicing", nullable = false)
    private boolean invoicing;

    @Column(name = "cap_banking", nullable = false)
    private boolean banking;

    @Column(name = "cap_planning", nullable = false)
    private boolean planning;

    @Column(name = "cap_audit", nullable = false)
    private boolean audit;

    public static MemberCapabilities of(boolean invoicing, boolean banking, boolean planning, boolean audit) {
        MemberCapabilities capabilities = new MemberCapabilities();
        capabilities.invoicing = invoicing;
        capabilities.banking = banking;
        capabilities.planning = planning;
        capabilities.audit = audit;
        return capabilities;
    }
}
