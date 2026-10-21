package io.rydata.platform.financing.billing;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.jspecify.annotations.Nullable;

import java.math.BigDecimal;
import java.util.List;

public record CreateInvoiceRequest(
        @Nullable String clientEntity,
        @Nullable String clientSubUnit,
        @Nullable String scopeRole,
        @Nullable @DecimalMin("0.01") BigDecimal amount,
        @Nullable @Valid List<InvoiceLineRequest> lineItems
) {
    public record InvoiceLineRequest(
            @NotBlank String title,
            @NotBlank String description,
            @NotNull @DecimalMin("0.00") BigDecimal amount
    ) {
    }
}
