package io.rydata.platform.financing.billing;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.jspecify.annotations.Nullable;

import java.math.BigDecimal;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record InvoiceResponse(
        String id,
        String clientEntity,
        String clientSubUnit,
        String avatarInitials,
        String scopeRole,
        String issueDate,
        String dueDate,
        BigDecimal amount,
        String status,
        String period,
        String taxId,
        List<InvoiceLineResponse> lineItems,
        @Nullable BigDecimal directCost,
        @Nullable BigDecimal grossProfit,
        @Nullable BigDecimal profitMarginPercent,
        BigDecimal writeOffMax,
        String recipientBank,
        String paymentProtocol,
        boolean disputed,
        @Nullable String disputeReason
) {
    public static InvoiceResponse from(Invoice invoice, boolean maskMargins, boolean maskBank) {
        return new InvoiceResponse(
                invoice.getId(),
                invoice.getClientEntity(),
                invoice.getClientSubUnit(),
                invoice.getAvatarInitials(),
                invoice.getScopeRole(),
                invoice.getIssueDate(),
                invoice.getDueDate(),
                invoice.getAmount(),
                invoice.getStatus().wire(),
                invoice.getPeriodLabel(),
                invoice.getTaxId(),
                invoice.getLineItems().stream().map(InvoiceLineResponse::from).toList(),
                maskMargins ? null : invoice.getDirectCost(),
                maskMargins ? null : invoice.getGrossProfit(),
                maskMargins ? null : invoice.getProfitMarginPercent(),
                invoice.getWriteOffMax(),
                maskBank ? "[Masked]" : invoice.getRecipientBank(),
                invoice.getPaymentProtocol(),
                invoice.isDisputed(),
                invoice.getDisputeReason());
    }
}
