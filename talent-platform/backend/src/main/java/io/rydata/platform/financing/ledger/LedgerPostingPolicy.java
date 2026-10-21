package io.rydata.platform.financing.ledger;

import io.rydata.platform.financing.config.FinancingProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class LedgerPostingPolicy {

    private final BigDecimal dualSignThreshold;

    public LedgerPostingPolicy(FinancingProperties properties) {
        this.dualSignThreshold = properties.dualSignThreshold();
    }

    public PostingDecision decide(BigDecimal amount) {
        boolean dualControl = amount.abs().compareTo(dualSignThreshold) > 0;
        return new PostingDecision(
                CashDirection.fromAmountSign(amount.signum()),
                dualControl ? TransactionStatus.THRESHOLD_FLAG : TransactionStatus.VERIFIED,
                dualControl,
                !dualControl);
    }

    public boolean crossesDualSignThreshold(BigDecimal amount) {
        return amount.abs().compareTo(dualSignThreshold) > 0;
    }

    public record PostingDecision(
            CashDirection direction,
            TransactionStatus status,
            boolean requiresDualSign,
            boolean approved
    ) {
    }
}
