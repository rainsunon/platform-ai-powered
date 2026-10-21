package io.rydata.platform.financing.billing;

import java.math.BigDecimal;

/**
 * Product and service lines vary by invoice, so they are stored as one jsonb document.
 */
public record InvoiceLineDetail(String id, String title, String description, BigDecimal amount) {
}
