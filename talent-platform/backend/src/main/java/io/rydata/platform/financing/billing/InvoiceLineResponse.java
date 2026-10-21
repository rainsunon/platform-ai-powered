package io.rydata.platform.financing.billing;

import java.math.BigDecimal;

public record InvoiceLineResponse(String id, String title, String description, BigDecimal amount) {

    public static InvoiceLineResponse from(InvoiceLineDetail item) {
        return new InvoiceLineResponse(item.id(), item.title(), item.description(), item.amount());
    }
}
