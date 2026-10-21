package io.rydata.platform.financing.ledger;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class LedgerSearchRow {

    private String id = "";
    private String ref = "";
    private String date = "";
    private String entity = "";
    private String client = "";
    private String accountCode = "";
    private String category = "";
    private BigDecimal amount = BigDecimal.ZERO;
    private String type = "";
    private String status = "";
    private String method = "";
    private boolean requiresDualSign;
    private boolean approved;
    private List<String> tags = new ArrayList<>();

    LedgerTransactionResponse toResponse() {
        List<String> present = tags.stream().filter(tag -> tag != null && !tag.isBlank()).toList();
        return new LedgerTransactionResponse(
                id,
                ref,
                date,
                entity,
                client,
                accountCode,
                category,
                amount,
                type,
                status,
                method,
                requiresDualSign,
                approved,
                present);
    }
}
